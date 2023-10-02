import { getLongestCommandLength } from './command';

export function renderCommandHelpText(commandsAndHelpText: string[][]) {
  const longestCommandLength = getLongestCommandLength(
    commandsAndHelpText.map(([commandKey]) => commandKey)
  );
  return commandsAndHelpText
    .map(
      ([commandKey, helpText]) =>
        `${commandKey.padEnd(longestCommandLength, ' ')}   ${helpText}`
    )
    .join('\n    ');
}

export function renderCommandExamples(examples: string[]) {
  return examples.map((example) => `$ cliff ${example}`).join('\n    ');
}
