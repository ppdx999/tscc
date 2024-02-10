import global from './global.js';

let i = 0;
export const auto = () => i++;

export function error(...args: any[]) {
  console.error(global.userInput);
  console.error(' '.repeat(global.token?.pos as number) + '^', ...args);

	process.exit(1);
}

