import { auto, error } from "./util.js";
import { TokenKind } from "./tokenize.js";
import global from "./global.js";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export const NodeKind = {
	Add: auto(),
	Sub: auto(),
	Mul: auto(),
	Div: auto(),
	Num: auto(),
  Eq: auto(),
  Ne: auto(),
  Lt: auto(),
  Le: auto(),
};

type NodeKind = typeof NodeKind[keyof typeof NodeKind];

export type Node = {
	kind: NodeKind;
	lhs: Node | null | undefined;
	rhs: Node | null | undefined;
	val: number;
};


// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export function parse(): Node {
  return expr();
}

// ---------------------------------------------------------------------
// Recursive descent parser
// ---------------------------------------------------------------------

function expr(): Node {
  return equality();
}

function equality(): Node {
  let node = relational();
  for (;;) {
    if (consume('==')) {
      node = newNode(NodeKind.Eq, node, relational(), 0);
    } else if (consume('!=')) {
      node = newNode(NodeKind.Ne, node, relational(), 0);
    } else {
      return node;
    }
  }
}

function relational(): Node {
  let node = add();
  for (;;) {
    if (consume('<')) {
      node = newNode(NodeKind.Lt, node, add(), 0);
    } else if (consume('<=')) {
      node = newNode(NodeKind.Le, node, add(), 0);
    } else if (consume('>')) {
      node = newNode(NodeKind.Lt, add(), node, 0);
    } else if (consume('>=')) {
      node = newNode(NodeKind.Le, add(), node, 0);
    } else {
      return node;
    }
  }
}

function add(): Node {
  let node = mul();
  for (;;) {
    if (consume('+')) {
      node = newNode(NodeKind.Add, node, mul(), 0);
    } else if (consume('-')) {
      node = newNode(NodeKind.Sub, node, mul(), 0);
    } else {
      return node;
    }
  }
}

function mul(): Node {
	let node = unary();
	for (;;) {
		if (consume('*')) {
			node = newNode(NodeKind.Mul, node, unary(), 0);
		} else if (consume('/')) {
			node = newNode(NodeKind.Div, node, unary(), 0);
		} else {
			return node;
		}
	}
}

function unary(): Node {
  if (consume('+'))
    return unary();
  if (consume('-'))
    return newNode(NodeKind.Sub, newNodeNum(0), unary(), 0);
  return primary();
  }

function primary(): Node {
	if (consume('(')) {
		const node = expr();
		expect(')');
		return node;
	}
	return newNodeNum(expectNum());
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

function newNode(kind: NodeKind, lhs: Node | null | undefined, rhs: Node | null | undefined, val: number): Node {
	return {
		kind,
		lhs,
		rhs,
		val
	};
}

function newNodeNum(val: number): Node {
	return {
		kind: NodeKind.Num,
		lhs: null,
		rhs: null,
		val
	};
}

