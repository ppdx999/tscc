import global from './global.js';

export function error(...args: any[]) {
  console.error(global.userInput);
  console.error(' '.repeat(global.token?.pos as number) + '^', ...args);

	process.exit(1);
}

