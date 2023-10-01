import chalk from 'chalk';

export default function sum({ args: [a, b], env }) {
  console.info('Running with env:', env);

  const aNumber = Number(a);
  const bNumber = Number(b);

  if (isNaN(aNumber)) {
    console.error(
      `Invalid first argument. Expected number, received ${aNumber}`
    );
    return;
  }

  if (isNaN(bNumber)) {
    console.error(
      `Invalid second argument. Expected number, received ${bNumber}`
    );
    return;
  }

  console.info(chalk.yellow('Sum result:'), aNumber + bNumber);
}
