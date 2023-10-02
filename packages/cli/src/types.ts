export interface Command {
  helpText: string;
  command: (...args: any[]) => unknown;
}
