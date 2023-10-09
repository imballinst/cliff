import chalk from 'chalk';
import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  type PromptConfig
} from '@inquirer/core';

type ConfirmConfig = PromptConfig<{
  transformer?: (value: boolean) => string;
}>;

export const confirm = createPrompt<boolean, ConfirmConfig>((config, done) => {
  const { transformer = (answer) => (answer ? 'yes' : 'no') } = config;
  const [status, setStatus] = useState('pending');
  const [value, setValue] = useState('');
  const prefix = usePrefix();

  useKeypress((key) => {
    if (key.name === 'y' || key.name === 'n') {
      const answer = key.name === 'y';

      setValue(transformer(answer));
      setStatus('done');
      done(answer);
    }
  });

  let formattedValue = value;
  let defaultValue = '';
  if (status === 'done') {
    formattedValue = chalk.cyan(value);
  } else {
    defaultValue = chalk.dim(' (y/n)');
  }

  const message = chalk.bold(config.message);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
