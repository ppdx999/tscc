import type { Token } from './tokenize.js';
import type { Node, Lvar } from './parse.js';

let token = null;
let nodes: Array<Node | null | undefined> = [];
let userInput = '';
let locals = null;

export default {
  token: token as Token | null | undefined,
  nodes,
  locals: locals as Lvar | null | undefined,
  userInput
};
