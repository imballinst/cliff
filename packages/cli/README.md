# @imballinstack/cliff

A somewhat test project to see if it's possible to extend a CLI's functionality without rebuilding it.

## Installation

```bash
npm install -g @imballinstack/cliff
```

## Demo

The CLI demo can be seen in this sandbox: https://codesandbox.io/p/sandbox/peaceful-joana-jp4w9h. Feel free forking the sandbox and playing on your own.

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
      "helpText": "Print hello using the $HELLO environment variable",
      "examples": ["helloworld"]
    },
    "sum": {
      "filePath": "./commands/sum.mjs",
      "helpText": "Sum 2 numbers",
      "examples": ["sum 1 2"]
    }
  }
}
```

See, we have a `commands`, which is a dictionary of command keys. By default it only has few default commands, but we can extend it by using `cliff import`.

```
➜ cliff

  Usage
    $ cliff <command>

  Commands
    env      View and modify environment variables (for cliff)
    import   Import commands from another repository
    reset    Reset to default settings

  Examples
    $ cliff env view
    $ cliff env add
    $ cliff import helloworld
    $ cliff reset
```

## Importing command

Using the sandbox repository as an example, we can do this:

```
➜ cliff import cli-extension/
? Select commands that you want to import helloworld   Print hello using the $HELLO
environment variable
{ chalk: '5.3.0' }
These dependencies are going to be added: chalk@5.3.0. Please go to /home/node/.imballinstack/cliff and then re-install the dependencies.
```

The `helloworld` command contains something like this:

```js
import chalk from 'chalk';

export default function helloworld({ env }) {
  console.info('Running with env:', env);
  console.info(chalk.yellow('hello'));
}
```

As we could see, it requires `chalk` imports, which is also defined in the extension's `package.json`. We will need to install the dependencies there first, using your preferred package manager. After installing the dependency, running `cliff` the second time will output this:

```
➜ cliff

  Usage
    $ cliff <command>

  Commands
    env          View and modify environment variables (for cliff)
    import       Import commands from another repository
    reset        Reset to default settings
    helloworld   Print hello using the $HELLO environment variable

  Examples
    $ cliff env view
    $ cliff env add
    $ cliff import helloworld
    $ cliff reset
    $ cliff helloworld
```

There is a command `cliff helloworld`, which is the command that we just imported. If we execute it:

```
➜ cliff helloworld
Running with env: {}
hello
```

It works!
