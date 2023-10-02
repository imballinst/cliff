export function renderCommandHelpText(commandsAndHelpText: string[][]) {
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
