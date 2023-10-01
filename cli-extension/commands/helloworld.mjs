import chalk from 'chalk';

export default function helloworld({ env }) {
  console.info('Running with env:', env);
  console.info(chalk.yellow('hello'));
}
