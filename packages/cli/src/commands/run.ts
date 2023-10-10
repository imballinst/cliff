import { autocomplete } from '../inquirer-extensions/autocomplete';

export async function runCommand() {
  const answer = await autocomplete({
    message: 'xdd',
    choices: [
      { value: 'test', name: 'test' },
      { value: 'hehe', name: 'hehe' },
      { value: 'xdd', name: 'xdd' }
    ]
  });

  console.info(answer);
}
