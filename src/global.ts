import type { Token } from './tokenize.js';
import type { Node } from './parse.js';

let token = null;
let nodes: Array<Node | null | undefined> = [];
let userInput = '';

export default {
  token: token as Token | null | undefined,
  nodes,
  userInput
};
