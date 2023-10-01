#!/usr/bin/env node

// @ts-check
import meow from 'meow';
import fs from 'fs/promises'
import path from 'path';
import os from 'os';

async function getPossibleCustomCommands() {
	try {
		const entryJSONString = await fs.readFile(path.join(os.homedir(), '.imballinstack/cliff/entry.json'), 'utf-8')
		const entryJSON = JSON.parse(entryJSONString)

		return entryJSON
	} catch (err) {
		return null
	}
}

const customEntry = await getPossibleCustomCommands()
let customCommands = {}

if (customEntry) {
	const commandKeys = Object.keys(customEntry.commands)
	const imports = await Promise.all(commandKeys.map(command => {
		const relativePath = path.relative(path.dirname(new URL(import.meta.url).pathname), path.join(os.homedir(), '.imballinstack/cliff', customEntry.commands[command]))
		return import(relativePath).then(result=> result.default)
	}))

	for (let i = 0; i < imports.length; i++) {
		customCommands[commandKeys[i]] = imports[i]
	}
}

const cli = meow(`
	Usage
	  $ foo <command>

	Options
	  --rainbow, -r  Include a rainbow

	Examples
	  $ foo unicorns --rainbow
	  🌈 unicorns 🌈
`, {
	importMeta: import.meta,
	flags: {
		rainbow: {
			type: 'boolean',
			shortFlag: 'r'
		}
	}
});
/*
{
	input: ['unicorns'],
	flags: {rainbow: true},
	...
}
*/

const [command] = cli.input

if (command === 'helloworld') {
	console.info("helloworld", customCommands)
	customCommands.helloworld?.()
} else {
	console.info(cli.input.at(0), cli.flags);
}