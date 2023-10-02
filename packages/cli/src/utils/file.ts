import fs from 'fs';

export function tryOpenFileIfExist(filePath: string) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return '';
  }
}
