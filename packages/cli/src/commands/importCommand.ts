import fs from 'fs/promises';
import path from 'path';
import checkbox from '@inquirer/checkbox';

import {
  getLongestCommandLength,
  getCustomCommandsFromFolder,
  getCustomCommands,
  addCustomCommands
} from '../utils/command.js';
import { DEFAULT_COMMANDS } from '../constants/commands.js';
import { EntryJsonCommand } from '../types.js';
import { CLIFF_HOME_DIR } from '../constants/path.js';

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
      )
    )
  ]);
}

// Helper functions.
async function updateEntryJson(
  filtered: Record<string, EntryJsonCommand>,
  answers: string[]
) {
  const added: Record<string, EntryJsonCommand> = {};
  for (const answer of answers) {
    added[answer] = filtered[answer];
  }

  added;
}
