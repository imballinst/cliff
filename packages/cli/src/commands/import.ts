import fs from 'fs/promises';
import path, { parse } from 'path';
import checkbox from '@inquirer/checkbox';

import {
  getLongestCommandLength,
  getCustomCommandsFromFolder,
  getCustomCommands,
  reorderCommands
} from '../utils/command.js';
import {
  DEFAULT_COMMANDS,
  DEFAULT_PACKAGE_JSON
} from '../constants/commands.js';
import { EntryJson, EntryJsonCommand } from '../types.js';
import { CLIFF_HOME_DIR } from '../constants/path.js';
import { execSync } from 'child_process';
import { init } from 'es-module-lexer';
import { tryOpenFileIfExist } from '../utils/file.js';

export async function importCommand(folderName: string) {
  const fullPath = path.isAbsolute(folderName)
    ? folderName
    : path.join(process.cwd(), folderName);
  const possibleCustomCommands = getCustomCommandsFromFolder(fullPath);

  const existingCustomCommands = await getCustomCommands();
  const existingCommands = Object.keys(DEFAULT_COMMANDS).concat(
    Object.keys(existingCustomCommands)
  );
  const filtered: Record<string, EntryJsonCommand> = {};

  if (possibleCustomCommands) {
    const commands = possibleCustomCommands.commands;
    for (const commandKey in commands) {
      if (existingCommands.includes(commandKey)) continue;

      filtered[commandKey] = commands[commandKey];
    }
  }

  const commands = Object.keys(filtered);
  const longestCommandLength = getLongestCommandLength(commands);
  const answers = await checkbox({
    message: 'Select commands that you want to import',
    choices: commands.map((commandKey) => ({
      name: `${commandKey.padEnd(longestCommandLength, ' ')}   ${
        filtered[commandKey].helpText
      }`,
      value: commandKey
    }))
  });

  // Create the home dir first.
  await fs.mkdir(path.join(CLIFF_HOME_DIR, 'commands'), { recursive: true });
  await Promise.all([
    ...answers.map(async (answer) => {
      // Copy commands.
      const fileToCopy = path.join(folderName, filtered[answer].filePath);
      return fs.copyFile(
        fileToCopy,
        path.join(CLIFF_HOME_DIR, filtered[answer].filePath)
      );
    }),
    // Update entry JSON.
    addCustomCommands(
      answers.reduce(
        (obj, answer) => {
          obj[answer] = filtered[answer];
          return obj;
        },
        {} as Record<string, EntryJsonCommand>
      ),
      folderName
    )
  ]);
}

// Helper functions.
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

  await Promise.all([
    fs.writeFile(entryJsonPath, JSON.stringify(entryJson, null, 2), 'utf-8'),
    fs.writeFile(
      homePackageJsonPath,
      JSON.stringify(homePackageJson, null, 2),
      'utf-8'
    )
  ]);

  const toBeAddedDependencyKeys = Object.keys(toBeAddedDependencies);
  if (toBeAddedDependencyKeys.length > 0) {
    // Run npm install.
    execSync('npm i', { cwd: CLIFF_HOME_DIR, stdio: 'ignore' });
  }
}
