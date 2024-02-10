import type { Token } from './tokenize.js';

let token = null;
let userInput = '';

export default {
  token: token as Token | null | undefined,
  userInput
};
