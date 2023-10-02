#!/usr/bin/env node

// src/cliff.ts
import meow from "meow";
import fs3 from "fs/promises";
import path4 from "path";
import os2 from "os";

// src/commands/env.ts
import fs2 from "fs/promises";
import path3 from "path";
import input from "@inquirer/input";

// src/constants/path.ts
import path from "path";
import os from "os";
var CLIFF_HOME_DIR = path.join(os.homedir(), ".imballinstack/cliff");

// src/constants/env.ts
import path2 from "path";

// src/utils/file.ts
import fs from "fs";
function tryOpenFileIfExist(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    return "";
  }
}

// src/constants/env.ts
var existingEnvFile = tryOpenFileIfExist(path2.join(CLIFF_HOME_DIR, ".env"));
var ENV_ENTRIES = Object.fromEntries(
  existingEnvFile.split("\n").filter(Boolean).map((item) => item.split("="))
);

// src/utils/help.ts
function renderCommandHelpText(commandsAndHelpText) {
  const maximumCommandKeyLength = Math.max(
    ...commandsAndHelpText.map(([commandKey]) => commandKey.length)
  );
  return commandsAndHelpText.map(
    ([commandKey, helpText]) => `${commandKey.padEnd(maximumCommandKeyLength, " ")} ${helpText}`
  ).join("\n    ");
}

// src/commands/env.ts
async function envCommand(subcommand) {
  switch (subcommand) {
    case "view": {
      try {
        const envFile = await fs2.readFile(
          path3.join(CLIFF_HOME_DIR, ".env"),
          "utf-8"
        );
        console.info(envFile);
      } catch (err) {
        console.error(
          "No environment variables are set yet, please create it first with `cliff env add`."
        );
      }
      break;
    }
    case "add": {
      try {
        const answer = await input({
          message: "Enter env variable in format of KEY=VALUE (separate by commas, if multiple)"
        });
        const envEntries = { ...ENV_ENTRIES };
        const inputtedEnvVars = answer.split(/,\s+/).filter(Boolean).map((item) => item.split("="));
        for (const inputtedEnvVar of inputtedEnvVars) {
          const [key, value] = inputtedEnvVar;
          envEntries[key] = value;
        }
        const newEnvFileContent = Object.entries(envEntries).map(([k, v]) => `${k}=${v}`).join("\n");
        await fs2.writeFile(
          path3.join(CLIFF_HOME_DIR, ".env"),
          newEnvFileContent,
          "utf-8"
        );
      } catch (err) {
        console.error(`Error when adding environment variable: ${err}.`);
      }
      break;
    }
    default: {
      const renderedEnvCommands = renderCommandHelpText([
        ["view", "View existing environment variables (for cliff)"],
        ["add", "Add environment variables (for cliff)"]
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

// src/cliff.ts
async function run() {
  const customEntry = await getPossibleCustomCommands();
  const commandsAndHelpText = [
    ["env", "View and modify environment variables (for cliff)"]
  ];
  let customCommands = {};
  if (customEntry) {
    const commandKeys = Object.keys(customEntry.commands);
    const importedCommands = await Promise.all(
      commandKeys.map(async (commandKey) => {
        const { filePath, helpText } = customEntry.commands[commandKey];
        const relativePath = path4.relative(
          path4.dirname(new URL(import.meta.url).pathname),
          path4.join(os2.homedir(), ".imballinstack/cliff", filePath)
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
    case "env": {
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
async function tryOpenFileIfExist2(filePath) {
  try {
    return await fs3.readFile(filePath, "utf-8");
  } catch (err) {
    return "";
  }
}
async function getPossibleCustomCommands() {
  const entryJSONString = await tryOpenFileIfExist2(
    path4.join(CLIFF_HOME_DIR, "entry.json")
  );
  if (!entryJSONString)
    return null;
  return JSON.parse(entryJSONString);
}
