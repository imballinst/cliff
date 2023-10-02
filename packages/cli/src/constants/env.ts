import path from 'path';

import { tryOpenFileIfExist } from '../utils/file';
import { CLIFF_HOME_DIR } from './path';

const existingEnvFile = tryOpenFileIfExist(path.join(CLIFF_HOME_DIR, '.env'));

export const ENV_ENTRIES = Object.fromEntries(
  existingEnvFile
    .split('\n')
    .filter(Boolean)
    .map((item) => item.split('='))
);
