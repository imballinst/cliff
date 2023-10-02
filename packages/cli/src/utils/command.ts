import fs from 'fs/promises';
import path from 'path';
import { tryOpenFileIfExist } from './file';
import { Command, EntryJson, EntryJsonCommand } from '../types';
import { CLIFF_HOME_DIR } from '../constants/path';

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
  commands: Record<string, EntryJsonCommand>
) {
  const entryJsonPath = path.join(CLIFF_HOME_DIR, 'entry.json');
  const entryJsonString = tryOpenFileIfExist(entryJsonPath);
  let entryJson: EntryJson = { commands: {} };

  if (entryJsonString) {
    entryJson = JSON.parse(entryJsonString);
  }

  for (const commandKey in commands) {
    entryJson.commands[commandKey] = commands[commandKey];
  }

  entryJson.commands = reorderCommands(entryJson.commands);
  return fs.writeFile(
    entryJsonPath,
    JSON.stringify(entryJson, null, 2),
    'utf-8'
  );
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
