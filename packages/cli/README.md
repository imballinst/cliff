# @imballinstack/cliff

A somewhat test project to see if it's possible to extend a CLI's functionality without rebuilding it.

## Installation

```bash
npm install -g @imballinstack/cliff
```

## Concepts

`cliff` is a single CLI app, but instead of having to rebuild the app every time, we can "add on top of it". How? `cliff` will read out this path: `$HOME/.imballinstack/cliff`. The folder should have this kind of structure (example can be adjusted according to needs):

```
cli-extension
├── commands
│   ├── helloworld.mjs
│   └── sum.mjs
├── entry.json
├── node_modules
│   └── ...
├── package.json
└── yarn.lock
```

So we have this simple JS project here, with the `package.json` and all that. This folder will be used to "expand" the commands of `cliff`. It will read `entry.json` when the CLI starts, then itw ill seek out the available commands (if exist). The `entry.json` has this kind of JSON structure:

```json
{
  "commands": {
    "helloworld": {
      "filePath": "./commands/helloworld.mjs",
      "helpText": "Print hello using the $HELLO environment variable"
    },
    "sum": {
      "filePath": "./commands/sum.mjs",
      "helpText": "Sum 2 numbers"
    }
  }
}
```

See, we have a `commands`, which is a dictionary of command keys. Since it has 2 fields, `helloworld` and `sum`, here's what will show up when we run `cliff`.

```
➜ /workspaces/cliff (main) $ cliff

  Usage
    $ cliff <command>

  Commands
    env        View and modify environment variables (for cliff)
    helloworld Print hello using the $HELLO environment variable
    sum        Sum 2 numbers

  Examples
    $ cliff helloworld
    $ cliff env view
    $ cliff env add
    $ cliff sum 1 2
```

As we could see, the contents of `entry.json` is parsed and "extended" to the main CLI. Now, let's see the file referred by the `sum` command.

```js
// commands/sum.js
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
```

See, we're using the `chalk` dependency here, which only exists in the `cliff` home directory (which is amazing). Let's try using it.

```
➜ /workspaces/cliff (main) $ cliff sum 1 2
Running with env: { HELLO: 'world' }
Sum result: 3
```

Now, it won't show color here, but the "Sum result: 3" is actually rendered with yellow color, hence it acts as proof that the main CLI app is extendable without having to install the extension's dependencies.
