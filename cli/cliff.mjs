#!/usr/bin/env node
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

console.info(getPossibleCustomCommands())

const cli = meow(`
	Usage
	  $ foo <input>

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

console.info(cli.input.at(0), cli.flags);