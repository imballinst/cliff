import { Command } from '../types';

export const DEFAULT_COMMANDS: Record<string, Omit<Command, 'command'>> = {
  env: {
    helpText: 'View and modify environment variables (for cliff)',
    examples: ['env view', 'env add']
  },
  import: {
    helpText: 'Import commands from another repository',
    examples: ['import helloworld']
  }
};
