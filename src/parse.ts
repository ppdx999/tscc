import { error } from "./util.js";
import { TokenKind, Token } from "./tokenize.js";
import global from "./global.js";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export const NodeKind = {
	Add: 'Add',
	Sub: 'Sub',
	Mul: 'Mul',
	Div: 'Div',
  Assign: 'Assign',
  Lvar: 'Lvar',
	Num: 'Num',
  Eq: 'Eq',
  Ne: 'Ne',
  Lt: 'Lt',
  Le: 'Le',
};

type NodeKind = typeof NodeKind[keyof typeof NodeKind];

export type Node = {
	kind: NodeKind;
	lhs: Node | null | undefined;
	rhs: Node | null | undefined;
	val: number | null | undefined;
  name: string | null | undefined;
  offset: number | null | undefined;
};


// ---------------------------------------------------------------------
// Recursive descent parser
// ---------------------------------------------------------------------

export function program() {
  let i = 0;
  while (!atEOF())
    global.nodes[i++] = stmt();
  global.nodes[i] = null;
}

function stmt() {
  const node = expr();
  expect(';');
  return node;
}

function expr(): Node {
  return assign();
}

function assign(): Node {
  let node = equality();
  if (consume('='))
    node = newBinary(NodeKind.Assign, node, assign());
  return node;
}

function equality(): Node {
  let node = relational();
  for (;;) {
    if (consume('==')) {
      node = newBinary(NodeKind.Eq, node, relational());
    } else if (consume('!=')) {
      node = newBinary(NodeKind.Ne, node, relational());
    } else {
      return node;
    }
  }
}

function relational(): Node {
  let node = add();
  for (;;) {
    if (consume('<')) {
      node = newBinary(NodeKind.Lt, node, add());
    } else if (consume('<=')) {
      node = newBinary(NodeKind.Le, node, add());
    } else if (consume('>')) {
      node = newBinary(NodeKind.Lt, add(), node);
    } else if (consume('>=')) {
      node = newBinary(NodeKind.Le, add(), node);
    } else {
      return node;
    }
  }
}

function add(): Node {
  let node = mul();
  for (;;) {
    if (consume('+')) {
      node = newBinary(NodeKind.Add, node, mul());
    } else if (consume('-')) {
      node = newBinary(NodeKind.Sub, node, mul());
    } else {
      return node;
    }
  }
}

function mul(): Node {
	let node = unary();
	for (;;) {
		if (consume('*')) {
			node = newBinary(NodeKind.Mul, node, unary());
		} else if (consume('/')) {
			node = newBinary(NodeKind.Div, node, unary());
		} else {
			return node;
		}
	}
}

function unary(): Node {
  if (consume('+'))
    return unary();
  if (consume('-'))
    return newBinary(NodeKind.Sub, newNum(0), unary());
  return primary();
  }

function primary(): Node {
	if (consume('(')) {
		const node = expr();
		expect(')');
		return node;
	}

  const token = consumeIdent()
  if(token)
    return newLvar(token.str)
	return newNum(expectNum());
}


// ---------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------
  

function consume(op: string): boolean {
	if (global.token?.kind !== TokenKind.Reserved || global.token?.value !== op) 
		return false;
	global.token = global.token?.next;
	return true;
}

function consumeIdent(): Token | null | undefined {
  if (global.token?.kind !== TokenKind.Ident)
    return null;

  const token = global.token;
  global.token = global.token?.next;
  return token;
}

function expect(op: string): void {
	if (global.token?.kind !==  TokenKind.Reserved || global.token?.value !== op) 
		error(`Expected ${op}`);
	global.token = global.token?.next;
}

function expectNum(): number {
	if (global.token?.kind !== TokenKind.Num)
		error('Expected number');
	const value = parseInt(global.token?.value as string);
	global.token = global.token?.next;
	return value;
}

function atEOF(): boolean {
  return global.token?.kind === TokenKind.EOF;
}

function newNode(kind: NodeKind): Node {
	return {
		kind,
		lhs: null,
		rhs: null,
		val: null,
    name: null,
    offset: null,
	};
}

function newBinary(kind: NodeKind, lhs: Node | null | undefined, rhs: Node | null | undefined): Node {
  const node = newNode(kind);
  node.lhs = lhs;
  node.rhs = rhs;
  return node;
}

function newNum(val: number): Node {
  const node = newNode(NodeKind.Num);
  node.val = val;
  return node;
}

function newLvar(name: string) {
  const node = newNode(NodeKind.Lvar);
  node.name = name;
  return node;
}
