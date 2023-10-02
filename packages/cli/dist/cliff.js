#!/usr/bin/env node

// src/cliff.ts
import meow from "meow";
import path6 from "path";
import os2 from "os";

// src/commands/env.ts
import fs2 from "fs/promises";
import path4 from "path";
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

// src/utils/command.ts
import path3 from "path";
function getPossibleCustomCommands(folderName) {
  const entryJSONString = tryOpenFileIfExist(
    path3.join(folderName, "entry.json")
  );
  if (!entryJSONString)
    return null;
  return JSON.parse(entryJSONString);
}
function getLongestCommandLength(commands) {
  return Math.max(...commands.map((commandKey) => commandKey.length));
}

// src/utils/help.ts
function renderCommandHelpText(commandsAndHelpText) {
  const longestCommandLength = getLongestCommandLength(
    commandsAndHelpText.map(([commandKey]) => commandKey)
  );
  return commandsAndHelpText.map(
    ([commandKey, helpText]) => `${commandKey.padEnd(longestCommandLength, " ")}   ${helpText}`
  ).join("\n    ");
}
function renderCommandExamples(examples) {
  return examples.map((example) => `$ cliff ${example}`).join("\n    ");
}

// src/commands/env.ts
async function envCommand(subcommand) {
  switch (subcommand) {
    case "view": {
      try {
        const envFile = await fs2.readFile(
          path4.join(CLIFF_HOME_DIR, ".env"),
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
          path4.join(CLIFF_HOME_DIR, ".env"),
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

// src/commands/importCommand.ts
import path5 from "path";
import checkbox from "@inquirer/checkbox";

// src/constants/commands.ts
var DEFAULT_COMMANDS = {
  env: {
    helpText: "View and modify environment variables (for cliff)",
    examples: ["env view", "env add"]
  },
  import: {
    helpText: "Import commands from another repository",
    examples: ["import helloworld"]
  }
};

// src/commands/importCommand.ts
async function importCommand(folderName) {
  const fullPath = path5.isAbsolute(folderName) ? folderName : path5.join(process.cwd(), folderName);
  const possibleCustomCommands = getPossibleCustomCommands(fullPath);
  const existingCommands = Object.keys(DEFAULT_COMMANDS);
  const filtered = {};
  console.info(existingCommands);
  if (possibleCustomCommands) {
    const commands2 = possibleCustomCommands.commands;
    for (const commandKey in commands2) {
      if (existingCommands.includes(commandKey))
        continue;
      filtered[commandKey] = commands2[commandKey];
    }
  }
  const commands = Object.keys(filtered);
  const longestCommandLength = getLongestCommandLength(commands);
  const answers = await checkbox({
    message: "Select commands that you want to import",
    choices: commands.map((commandKey) => ({
      name: `${commandKey.padEnd(longestCommandLength, " ")}   ${filtered[commandKey].helpText}`,
      value: commandKey
    }))
  });
  for (const answer of answers) {
  }
}

// src/cliff.ts
async function run() {
  const customEntry = getPossibleCustomCommands(CLIFF_HOME_DIR);
  const allCommandsAndHelpText = [];
  const allExamples = [];
  for (const commandKey in DEFAULT_COMMANDS) {
    const { helpText, examples } = DEFAULT_COMMANDS[commandKey];
    allCommandsAndHelpText.push([commandKey, helpText]);
    allExamples.push(...examples);
  }
  let customCommands = {};
  if (customEntry) {
    const commandKeys = Object.keys(customEntry.commands);
    const importedCommands = await Promise.all(
      commandKeys.map(async (commandKey) => {
        const { filePath, examples, helpText } = customEntry.commands[commandKey];
        const srcDir = path6.dirname(new URL(import.meta.url).pathname);
        const dstDir = path6.join(
          os2.homedir(),
          ".imballinstack/cliff",
          filePath
        );
        const relativePath = path6.relative(srcDir, dstDir);
        const importedCommand = await import(relativePath).then(
          (result) => result.default
        );
        return { importedCommand, commandKey, examples, helpText };
      })
    );
    for (let i = 0; i < importedCommands.length; i++) {
      const { helpText, examples, commandKey, importedCommand } = importedCommands[i];
      allCommandsAndHelpText.push([commandKey, helpText]);
      allExamples.push(...examples);
      customCommands[commandKeys[i]] = {
        helpText,
        examples,
        command: importedCommand
      };
    }
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
      case "env": {
        const [subcommand] = args;
        await envCommand(subcommand);
        break;
      }
      case "import": {
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
    if (err instanceof Error) {
      if (err.message.includes("User force closed")) {
        return;
      }
      console.error(err);
    }
  }
}
run();
