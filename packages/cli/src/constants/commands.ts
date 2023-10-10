import { Command } from '../types';

export const DEFAULT_COMMANDS: Record<string, Omit<Command, 'command'>> = {
  env: {
    helpText: 'View and modify environment variables (for cliff)',
    examples: ['env view', 'env add']
  },
  import: {
    helpText: 'Import commands from another repository',
    examples: ['import helloworld']
  },
  reset: {
    helpText: 'Reset to default settings',
    examples: ['reset']
  },
  run: {
    helpText: 'Explore all available commands interactively',
    examples: ['run']
  }
};

export const DEFAULT_PACKAGE_JSON = {
  name: 'cliff',
  version: '0.0.0',
  dependencies: {}
};
