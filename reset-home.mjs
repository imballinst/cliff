import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const PATH_TO_CLIFF_HOME_DIR = path.join(os.homedir(), '.imballinstack/cliff');

async function copyExtension() {
  try {
    await fs.rm(PATH_TO_CLIFF_HOME_DIR, { recursive: true, force: true });
  } catch (err) {
    // No-op.
    console.error(err);
  }
}

copyExtension();
