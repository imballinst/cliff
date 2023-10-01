#!/usr/bin/env node

// @ts-check
import meow from 'meow';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import input from '@inquirer/input';

const CLIFF_HOME_DIR = path.join(os.homedir(), '.imballinstack/cliff');

async function getPossibleCustomCommands() {
  try {
    const entryJSONString = await fs.readFile(
      path.join(CLIFF_HOME_DIR, 'entry.json'),
      'utf-8'
    );
    const entryJSON = JSON.parse(entryJSONString);

    return entryJSON;
  } catch (err) {
    return null;
  }
}

const customEntry = await getPossibleCustomCommands();
let customCommands = {};

if (customEntry) {
  const commandKeys = Object.keys(customEntry.commands);
  const imports = await Promise.all(
    commandKeys.map((command) => {
      const relativePath = path.relative(
        path.dirname(new URL(import.meta.url).pathname),
        path.join(
          os.homedir(),
          '.imballinstack/cliff',
          customEntry.commands[command]
        )
      );
      return import(relativePath).then((result) => result.default);
    })
  );

  for (let i = 0; i < imports.length; i++) {
    customCommands[commandKeys[i]] = imports[i];
  }
}

const cli = meow(
  `
	Usage
	  $ foo <command>

	Commands
	  env  					View and modify environment variables (for cliff)

	Options
	  --rainbow, -r  Include a rainbow

	Examples
	  $ foo unicorns --rainbow
	  🌈 unicorns 🌈
`,
  {
    importMeta: import.meta,
    flags: {
      rainbow: {
        type: 'boolean',
        shortFlag: 'r'
      }
    }
  }
);
/*
{
	input: ['unicorns'],
	flags: {rainbow: true},
	...
}
*/

const [command, subcommand] = cli.input;

switch (command) {
  case 'helloworld': {
    console.info('helloworld', customCommands);
    customCommands.helloworld?.();
    break;
  }
  case 'env': {
    await envCommand(subcommand);
    break;
  }
  default: {
    console.info(cli.input.at(0), cli.flags);
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
          'No environment variables are set yet, please create it first with `cliff env add`'
        );
      }
    }
    case 'add': {
      try {
        const envFile = await fs.readFile(
          path.join(CLIFF_HOME_DIR, '.env'),
          'utf-8'
        );
        console.info(envFile);
      } catch (err) {
        // No-op.
        console.error(
          'No environment variables are set yet, please create it first with `cliff env add`'
        );
      }
    }
  }
}
