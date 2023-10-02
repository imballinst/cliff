import fs from 'fs/promises';
import path from 'path';
import input from '@inquirer/input';

import { CLIFF_HOME_DIR } from '../constants/path.js';
import { ENV_ENTRIES } from '../constants/env.js';
import { renderCommandHelpText } from '../utils/help.js';

export async function envCommand(subcommand: string) {
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
        const envEntries = { ...ENV_ENTRIES };

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
