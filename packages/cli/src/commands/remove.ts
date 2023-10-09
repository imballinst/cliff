import fs from 'fs/promises';
import path from 'path';
import checkbox from '@inquirer/checkbox';

import {
  getLongestCommandLength,
  getCustomCommandsFromFolder
} from '../utils/command.js';
import { EntryJson, EntryJsonCommand } from '../types.js';
import { CLIFF_HOME_DIR } from '../constants/path.js';
import { tryOpenFileIfExist } from '../utils/file.js';

export async function removeCommand() {
  const existingCustomCommands =
    getCustomCommandsFromFolder(CLIFF_HOME_DIR)?.commands || {};

  const commands = Object.keys(existingCustomCommands);
  const longestCommandLength = getLongestCommandLength(commands);
  const answers = await checkbox({
    message: 'Select commands that you want to remove',
    choices: commands.map((commandKey) => ({
      name: `${commandKey.padEnd(longestCommandLength, ' ')}   ${
        existingCustomCommands[commandKey].helpText
      }`,
      value: commandKey
    }))
  });

  await removeCustomCommands(
    answers.reduce(
      (obj, answer) => {
        obj[answer] = existingCustomCommands[answer];
        return obj;
      },
      {} as Record<string, EntryJsonCommand>
    )
  );
}

// Helper functions.
async function removeCustomCommands(
  commands: Record<string, EntryJsonCommand>
) {
  const packageJsonPath = path.join(CLIFF_HOME_DIR, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

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

      if (commandsWithCurrentDependency.length === 0) {
        if (packageJson.dependencies) {
          delete packageJson.dependencies[dependencyName];
        }

        if (packageJson.devDependencies) {
          delete packageJson.devDependencies[dependencyName];
        }
      }
    }
  }

  await Promise.all([
    ...filesToRemove.map((filePath) =>
      fs.rm(path.join(CLIFF_HOME_DIR, filePath))
    ),
    fs.writeFile(entryJsonPath, JSON.stringify(entryJson, null, 2), 'utf-8'),
    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8')
  ]);
}
