import fs from 'fs/promises';
import path from 'path';

import { DEFAULT_PACKAGE_JSON } from '../constants/commands.js';
import { CLIFF_HOME_DIR } from '../constants/path.js';
import { confirm } from '../inquirer-extensions/confirm.js';

export async function resetCommand() {
  const isResetAccepted = await confirm({
    message: 'All configurations will be reset to default. Are you sure?'
  });
  if (!isResetAccepted) return;

  await Promise.all([
    // Nuke the commands dir.
    fs.rm(path.join(CLIFF_HOME_DIR, 'commands'), {
      recursive: true,
      force: true
    }),
    // Nuke the entry.json.
    fs.rm(path.join(CLIFF_HOME_DIR, 'entry.json'), { force: true }),
    // Reset the package.json dependencies.
    fs.writeFile(
      path.join(CLIFF_HOME_DIR, 'package.json'),
      JSON.stringify(DEFAULT_PACKAGE_JSON, null, 2),
      'utf-8'
    )
  ]);
}
