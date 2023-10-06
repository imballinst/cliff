import fs from 'fs/promises';
import path from 'path';
import { init, parse } from 'es-module-lexer';

import { tryOpenFileIfExist } from './file';
import { Command, EntryJson, EntryJsonCommand } from '../types';
import { CLIFF_HOME_DIR } from '../constants/path';
import { DEFAULT_PACKAGE_JSON } from '../constants/commands';

export function getCustomCommandsFromFolder(
  folderName: string
): EntryJson | null {
  const entryJsonString = tryOpenFileIfExist(
    path.join(folderName, 'entry.json')
  );

  if (!entryJsonString) return null;
  return JSON.parse(entryJsonString);
}

export async function addCustomCommands(
  commands: Record<string, EntryJsonCommand>,
  sourceFolder: string
) {
  const sourceFolderPackageJsonPath = path.join(sourceFolder, 'package.json');
  const sourceFolderPackageJson = JSON.parse(
    await fs.readFile(sourceFolderPackageJsonPath, 'utf-8')
  );
  const sourceFolderDependencies = sourceFolderPackageJson.dependencies;

  const homePackageJsonPath = path.join(CLIFF_HOME_DIR, 'package.json');
  let homePackageJsonString = tryOpenFileIfExist(homePackageJsonPath);
  if (!homePackageJsonString) {
    homePackageJsonString = JSON.stringify(DEFAULT_PACKAGE_JSON);
  }

  const homePackageJson = JSON.parse(homePackageJsonString);

  const entryJsonPath = path.join(CLIFF_HOME_DIR, 'entry.json');
  const entryJsonString = tryOpenFileIfExist(entryJsonPath);
  let entryJson: EntryJson = { commands: {}, dependenciesByCommand: {} };

  if (entryJsonString) {
    entryJson = JSON.parse(entryJsonString);
  }

  await init;

  const toBeAddedDependencies: Record<string, string> = {};
  entryJson.dependenciesByCommand = entryJson.dependenciesByCommand;

  for (const commandKey in commands) {
    entryJson.commands[commandKey] = commands[commandKey];

    const content = await fs.readFile(
      path.join(CLIFF_HOME_DIR, commands[commandKey].filePath),
      'utf-8'
    );
    const parsed: any = parse(content);

    for (const rawItem of parsed) {
      const item = rawItem['0'];
      if (!item) continue;

      if (typeof item.a !== 'undefined') {
        const importName = item.n;

        // If relative, or if version is the same, then skip.
        if (importName.startsWith('.')) continue;
        if (
          homePackageJson.dependencies[importName] ===
          sourceFolderDependencies[importName]
        ) {
          continue;
        }

        toBeAddedDependencies[importName] =
          sourceFolderDependencies[importName];

        if (!entryJson.dependenciesByCommand[importName]) {
          entryJson.dependenciesByCommand[importName] = [];
        }

        entryJson.dependenciesByCommand[importName].push(commandKey);
      }
    }
  }

  homePackageJson.dependencies = {
    ...homePackageJson.dependencies,
    ...toBeAddedDependencies
  };

  entryJson.commands = reorderCommands(entryJson.commands);

  const toBeAddedDependencyKeys = Object.keys(toBeAddedDependencies);

  if (toBeAddedDependencyKeys.length > 0) {
    console.info(
      `These dependencies are going to be added: ${toBeAddedDependencyKeys.map(
        (key) => `${key}@${toBeAddedDependencies[key]}`
      )}. Please go to ${CLIFF_HOME_DIR} and then re-install the dependencies.`
    );
  }

  return Promise.all([
    fs.writeFile(entryJsonPath, JSON.stringify(entryJson, null, 2), 'utf-8'),
    fs.writeFile(
      homePackageJsonPath,
      JSON.stringify(homePackageJson, null, 2),
      'utf-8'
    )
  ]);
}

export async function removeCustomCommands(
  commands: Record<string, EntryJsonCommand>
) {
  const entryJsonPath = path.join(CLIFF_HOME_DIR, 'entry.json');
  const entryJsonString = tryOpenFileIfExist(entryJsonPath);
  let entryJson: EntryJson = { commands: {}, dependenciesByCommand: {} };

  if (entryJsonString) {
    entryJson = JSON.parse(entryJsonString);
  }

  const filesToRemove: string[] = [];

  for (const commandKey in commands) {
    // Add to removed files.
    filesToRemove.push(entryJson.commands[commandKey].filePath);

    // Remove the command.
    delete entryJson.commands[commandKey];

    // Update the entryJson.
    for (const dependencyName in entryJson.dependenciesByCommand) {
      const commandsWithCurrentDependency =
        entryJson.dependenciesByCommand[dependencyName];
      const idx = commandsWithCurrentDependency.findIndex(
        (item) => item === commandKey
      );
      if (idx > -1) {
        commandsWithCurrentDependency.splice(idx, 1);
      }
    }
  }

  await Promise.all([
    ...filesToRemove.map((filePath) =>
      fs.rm(path.join(CLIFF_HOME_DIR, filePath))
    ),
    fs.writeFile(entryJsonPath, JSON.stringify(entryJson, null, 2), 'utf-8')
  ]);
}

export function getLongestCommandLength(commands: string[]) {
  return Math.max(...commands.map((commandKey) => commandKey.length));
}

export async function getCustomCommands() {
  const homeEntryJson = getCustomCommandsFromFolder(CLIFF_HOME_DIR);
  let customCommands: Record<string, Command> = {};

  if (homeEntryJson) {
    const commandKeys = Object.keys(homeEntryJson.commands);
    const importedCommands = await Promise.all(
      commandKeys.map(async (commandKey) => {
        const { filePath, examples, helpText } =
          homeEntryJson.commands[commandKey];
        const srcDir = path.dirname(new URL(import.meta.url).pathname);
        const dstDir = path.join(CLIFF_HOME_DIR, filePath);

        const relativePath = path.relative(srcDir, dstDir);
        const importedCommand = await import(relativePath).then(
          (result) => result.default
        );

        return { importedCommand, commandKey, examples, helpText };
      })
    );

    for (let i = 0; i < importedCommands.length; i++) {
      const { helpText, examples, commandKey, importedCommand } =
        importedCommands[i];

      customCommands[commandKey] = {
        helpText,
        examples,
        command: importedCommand
      };
    }
  }

  return customCommands;
}

// Helper functons.
function reorderCommands<T extends Record<string, any>>(unordered: T): T {
  return Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {} as any);
}
