import { error } from "./util.js";
import { TokenKind, Token, NodeKind, Node, Var, Program } from "./type.js";
import global from "./global.js";

let locals: Var | null | undefined = null;

// ---------------------------------------------------------------------
// Recursive descent parser
// ---------------------------------------------------------------------

export function program(): Program {
  locals = null;
  const head = {next: null} as Node;
  let cur = head;

  while (!atEOF()) {
    cur.next = stmt();
    cur = cur.next;
  }

  return {
    node: head.next,
    locals: locals,
    stackSize: 0,
  };
}

function stmt() {
  let node: Node;

  if (consume('return')) {
    node = newNode(NodeKind.Return);
    node.lhs = expr();
    expect(';');
    return node;
  } else if (consume('if')) {
    node = newNode(NodeKind.If);
    expect('(');
    node.cond = expr();
    expect(')');
    node.then = stmt();
    if (consume('else'))
      node.els = stmt();
    return node;
  } else if (consume('while')) {
    node = newNode(NodeKind.While);
    expect('(');
    node.cond = expr();
    expect(')');
    node.then = stmt();
    return node;
  }
  else {
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
    let var_ = findVar(token.str);
    if (!var_) var_ = newVar(token.str);
    return newNodeVar(var_);
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
    var: null,
    cond: null,
    then: null,
    els: null,
    next: null,
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

function newNodeVar(var_: Var): Node {
  const node = newNode(NodeKind.Var);
  node.var = var_;
  return node;
}

function newVar(name: string): Var {
  const var_: Var = {
    name,
    offset: 0,
    next: locals,
  };
  locals = var_;
  return var_;
}

function findVar(name: string): Var | null | undefined {
  for (let var_ = locals; var_; var_ = var_.next)
    if (var_.name === name)
      return var_;
  return null;
}
