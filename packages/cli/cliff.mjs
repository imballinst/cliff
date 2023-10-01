#!/usr/bin/env node

// @ts-check
import meow from 'meow';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import input from '@inquirer/input';

const CLIFF_HOME_DIR = path.join(os.homedir(), '.imballinstack/cliff');

async function getPossibleCustomCommands() {
  const entryJSONString = await tryOpenFileIfExist(
    path.join(CLIFF_HOME_DIR, 'entry.json')
  );

  if (!entryJSONString) return null;
  return JSON.parse(entryJSONString);
}

const existingEnvFile = await tryOpenFileIfExist(
  path.join(CLIFF_HOME_DIR, '.env')
);
const envEntries = Object.fromEntries(
  existingEnvFile
    .split('\n')
    .filter(Boolean)
    .map((item) => item.split('='))
);

const customEntry = await getPossibleCustomCommands();
const commandsAndHelpText = [
  ['env', 'View and modify environment variables (for cliff)']
];

let customCommands = {};

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
      customCommands[command]?.command({ args, env: envEntries });
      break;
    }

    cli.showHelp();
  }
}

// Helper functions.
async function envCommand(subcommand) {
  switch (subcommand) {
    case 'view': {
      try {
        const envFile = await fs.readFile(
          path.join(CLIFF_HOME_DIR, '.env'),
          'utf-8'
        );
        console.info(envFile);
      } catch (err) {
        // No-op.
        console.error(
          'No environment variables are set yet, please create it first with `cliff env add`.'
        );
      }

      break;
    }
    case 'add': {
      try {
        const answer = await input({
          message:
            'Enter env variable in format of KEY=VALUE (separate by commas, if multiple)'
        });

        const inputtedEnvVars = answer
          .split(/,\s+/)
          .filter(Boolean)
          .map((item) => item.split('='));

        for (const inputtedEnvVar of inputtedEnvVars) {
          const [key, value] = inputtedEnvVar;
          envEntries[key] = value;
        }

        const newEnvFileContent = Object.entries(envEntries)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
        await fs.writeFile(
          path.join(CLIFF_HOME_DIR, '.env'),
          newEnvFileContent,
          'utf-8'
        );
      } catch (err) {
        // No-op.
        console.error(`Error when adding environment variable: ${err}.`);
      }

      break;
    }
    default: {
      const renderedEnvCommands = renderCommandHelpText([
        ['view', 'View existing environment variables (for cliff)'],
        ['add', 'Add environment variables (for cliff)']
      ]);

      console.info(`
  Usage
    $ cliff env <command>

  Commands
    ${renderedEnvCommands}

  Examples
    $ cliff env view
    $ cliff env add
  `);
      break;
    }
  }
}

async function tryOpenFileIfExist(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    return '';
  }
}

function renderCommandHelpText(commandsAndHelpText) {
  const maximumCommandKeyLength = Math.max(
    ...commandsAndHelpText.map(([commandKey]) => commandKey.length)
  );
  return commandsAndHelpText
    .map(
      ([commandKey, helpText]) =>
        `${commandKey.padEnd(maximumCommandKeyLength, ' ')} ${helpText}`
    )
    .join('\n    ');
}
