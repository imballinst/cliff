#!/usr/bin/env node

import meow from 'meow';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import { envCommand } from './commands/env.js';
import { renderCommandHelpText } from './utils/help.js';
import { CLIFF_HOME_DIR } from './constants/path.js';
import { ENV_ENTRIES } from './constants/env.js';
import { Command } from './types.js';

async function run() {
  const customEntry = await getPossibleCustomCommands();
  const commandsAndHelpText = [
    ['env', 'View and modify environment variables (for cliff)']
  ];

  let customCommands: Record<string, Command> = {};

  if (customEntry) {
    const commandKeys = Object.keys(customEntry.commands);
    const importedCommands = await Promise.all(
      commandKeys.map(async (commandKey) => {
        const { filePath, helpText } = customEntry.commands[commandKey];
        const relativePath = path.relative(
          path.dirname(new URL(import.meta.url).pathname),
          path.join(os.homedir(), '.imballinstack/cliff', filePath)
        );
        const importedCommand = await import(relativePath).then(
          (result) => result.default
        );

        return { importedCommand, commandKey, helpText };
      })
    );

    for (let i = 0; i < importedCommands.length; i++) {
      const { helpText, commandKey, importedCommand } = importedCommands[i];

      commandsAndHelpText.push([commandKey, helpText]);
      customCommands[commandKeys[i]] = {
        helpText,
        command: importedCommand
      };
    }
  }

  const renderedCommands = renderCommandHelpText(commandsAndHelpText);
  const cli = meow(
    `
  Usage
    $ cliff <command>

  Commands
    ${renderedCommands}

  Examples
    $ cliff helloworld
    $ cliff env view
    $ cliff env add
    $ cliff sum 1 2
  `,
    {
      importMeta: import.meta
    }
  );

  const [command, ...args] = cli.input;

  switch (command) {
    case 'env': {
      const [subcommand] = args;
      await envCommand(subcommand);
      break;
    }
    default: {
      if (customCommands[command]) {
        customCommands[command]?.command({ args, env: ENV_ENTRIES });
        break;
      }

      cli.showHelp();
    }
  }
}

run();

// Helper functions.
async function tryOpenFileIfExist(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    return '';
  }
}

async function getPossibleCustomCommands() {
  const entryJSONString = await tryOpenFileIfExist(
    path.join(CLIFF_HOME_DIR, 'entry.json')
  );

  if (!entryJSONString) return null;
  return JSON.parse(entryJSONString);
}
