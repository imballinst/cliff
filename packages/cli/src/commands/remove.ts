import fs from 'fs/promises';
import path from 'path';
import checkbox from '@inquirer/checkbox';

import {
  getLongestCommandLength,
  getCustomCommandsFromFolder,
  getCustomCommands,
  addCustomCommands,
  removeCustomCommands
} from '../utils/command.js';
import { DEFAULT_COMMANDS } from '../constants/commands.js';
import { EntryJsonCommand } from '../types.js';
import { CLIFF_HOME_DIR } from '../constants/path.js';

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
