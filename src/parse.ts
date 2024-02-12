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
  Return: 'Return',
  If: 'If',
};

type NodeKind = typeof NodeKind[keyof typeof NodeKind];

export type Node = {
	kind: NodeKind;
	lhs: Node | null | undefined;
	rhs: Node | null | undefined;
	val: number | null | undefined;
  name: string | null | undefined;
  offset: number | null | undefined;
  cond: Node | null | undefined;
  then: Node | null | undefined;
  els: Node | null | undefined;
};


export type Lvar = {
  name: string;
  offset: number;
  next: Lvar | null | undefined;
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
  let node: Node;

  if (consumeReturn()) {
    node = newNode(NodeKind.Return);
    node.lhs = expr();
    expect(';');
    return node;
  } else if (consumeIf()) {
    node = newNode(NodeKind.If);
    expect('(');
    node.cond = expr();
    expect(')');
    node.then = stmt();
    if (consume('else'))
      node.els = stmt();
    return node;
  } else {
    node = expr();
    expect(';');
    return node;
  }

}

function expr(): Node {
  return assign();
}

function assign(): Node {
  let node = equality();
  if (consume('='))
    node = newNodeBinary(NodeKind.Assign, node, assign());
  return node;
}

function equality(): Node {
  let node = relational();
  for (;;) {
    if (consume('==')) {
      node = newNodeBinary(NodeKind.Eq, node, relational());
    } else if (consume('!=')) {
      node = newNodeBinary(NodeKind.Ne, node, relational());
    } else {
      return node;
    }
  }
}

function relational(): Node {
  let node = add();
  for (;;) {
    if (consume('<')) {
      node = newNodeBinary(NodeKind.Lt, node, add());
    } else if (consume('<=')) {
      node = newNodeBinary(NodeKind.Le, node, add());
    } else if (consume('>')) {
      node = newNodeBinary(NodeKind.Lt, add(), node);
    } else if (consume('>=')) {
      node = newNodeBinary(NodeKind.Le, add(), node);
    } else {
      return node;
    }
  }
}

function add(): Node {
  let node = mul();
  for (;;) {
    if (consume('+')) {
      node = newNodeBinary(NodeKind.Add, node, mul());
    } else if (consume('-')) {
      node = newNodeBinary(NodeKind.Sub, node, mul());
    } else {
      return node;
    }
  }
}

function mul(): Node {
	let node = unary();
	for (;;) {
		if (consume('*')) {
			node = newNodeBinary(NodeKind.Mul, node, unary());
		} else if (consume('/')) {
			node = newNodeBinary(NodeKind.Div, node, unary());
		} else {
			return node;
		}
	}
}

function unary(): Node {
  if (consume('+'))
    return unary();
  if (consume('-'))
    return newNodeBinary(NodeKind.Sub, newNodeNum(0), unary());
  return primary();
  }

function primary(): Node {
	if (consume('(')) {
		const node = expr();
		expect(')');
		return node;
	}

  const token = consumeIdent()
  if(token) {
    const node = newNodeLvar(token.str)
    let lvar = findLvar(token.str);
    if (!lvar) lvar = newLvar(token.str);
    node.offset = lvar.offset;
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

function consumeIdent(): Token | null | undefined {
  if (global.token?.kind !== TokenKind.Ident)
    return null;

  const token = global.token;
  global.token = global.token?.next;
  return token;
}

function consumeReturn(): boolean {
  if (global.token?.kind !== TokenKind.Reserved || global.token?.value !== 'return')
    return false;
  global.token = global.token?.next;
  return true;
}

function consumeIf(): boolean {
  if (global.token?.kind !== TokenKind.Reserved || global.token?.value !== 'if')
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
    cond: null,
    then: null,
    els: null,
	};
}

function newNodeBinary(kind: NodeKind, lhs: Node | null | undefined, rhs: Node | null | undefined): Node {
  const node = newNode(kind);
  node.lhs = lhs;
  node.rhs = rhs;
  return node;
}

function newNodeNum(val: number): Node {
  const node = newNode(NodeKind.Num);
  node.val = val;
  return node;
}

function newNodeLvar(name: string) {
  const node = newNode(NodeKind.Lvar);
  node.name = name;
  return node;
}

function newLvar(name: string): Lvar {
  const newLvar: Lvar = {
    name,
    offset: (global?.locals?.offset ?? 0) + 8,
    next: global.locals,
  };
  global.locals = newLvar;
  return newLvar;
}

function findLvar(name: string): Lvar | null | undefined {
  for (let var_ = global.locals; var_; var_ = var_.next) {
    if (var_.name === name) return var_;
  }
  return null;
}
