#!/usr/bin/env node
import meow from 'meow';

import { envCommand } from './commands/env.js';
import { renderCommandExamples, renderCommandHelpText } from './utils/help.js';
import { ENV_ENTRIES } from './constants/env.js';
import { importCommand } from './commands/importCommand.js';
import { getCustomCommands } from './utils/command.js';
import { DEFAULT_COMMANDS } from './constants/commands.js';

async function run() {
  // TODO: maybe we can make this better, in one object, perhaps?
  const allCommandsAndHelpText: string[][] = [];
  const allExamples: string[] = [];

  for (const commandKey in DEFAULT_COMMANDS) {
    const { helpText, examples } = DEFAULT_COMMANDS[commandKey];
    allCommandsAndHelpText.push([commandKey, helpText]);
    allExamples.push(...examples);
  }

  const customCommands = await getCustomCommands();
  for (const commandKey in customCommands) {
    const { examples, helpText, command } = customCommands[commandKey];

    allCommandsAndHelpText.push([commandKey, helpText]);
    allExamples.push(...examples);
    customCommands[commandKey] = {
      helpText,
      examples,
      command
    };
  }

  const renderedCommands = renderCommandHelpText(allCommandsAndHelpText);
  const renderedExamples = renderCommandExamples(allExamples);
  const cli = meow(
    `
  Usage
    $ cliff <command>

  Commands
    ${renderedCommands}

  Examples
    ${renderedExamples}
  `,
    {
      importMeta: import.meta
    }
  );

  const [command, ...args] = cli.input;

  try {
    switch (command) {
      case 'env': {
        const [subcommand] = args;
        await envCommand(subcommand);
        break;
      }
      case 'import': {
        const [folderPath] = args;
        await importCommand(folderPath);
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
  } catch (err) {
    // No-op.
    if (err instanceof Error) {
      if (err.message.includes('User force closed')) {
        // No-op.
        return;
      }

      console.error(err);
    }
  }
}

run();
