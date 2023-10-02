export interface Command {
  helpText: string;
  examples: string[];
  command: (...args: any[]) => unknown;
}

export interface EntryJsonCommand extends Omit<Command, 'command'> {
  filePath: string;
}

export interface EntryJson {
  commands: Record<string, EntryJsonCommand>;
}
