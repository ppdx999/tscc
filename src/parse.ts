import { error } from "./util.js";
import { TokenKind, Token, NodeKind, Node, Var, Func, VarList } from "./type.js";
import global from "./global.js";

let locals: VarList | null | undefined = null;

// ---------------------------------------------------------------------
// Recursive descent parser
// ---------------------------------------------------------------------


export function program(): Func | null | undefined {
  const head = {next: null} as Func;
  let cur = head;

  while (!atEOF()) {
    cur.next = func();
    cur = cur.next;
  }

  return head.next
}

export function func(): Func {
  locals = null;

  const name = expectIdent();
  const func = newFunc(name);

  expect('(');
  func.params = funcParams();
  expect('{');

  const head = {next: null} as Node;
  let cur = head;

  while (!consume('}')) {
    cur.next = stmt();
    cur = cur.next;
  }

  func.node = head.next;
  func.locals = locals;

  return func;
}

function funcParams() {
  if (consume(')'))
    return null;

  const head = newVarList();
  head.var = newVar(expectIdent());
  let cur = head;

  while (!consume(')')) {
    expect(',');
    cur.next = newVarList();
    cur.next.var = newVar(expectIdent());
    cur = cur.next;
  }

  return head;
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
  } else if (consume('for')) {
    node = newNode(NodeKind.For);
    expect('(');
    if (!consume(';')) {
      node.init = expr();
      expect(';');
    }
    if (!consume(';')) {
      node.cond = expr();
      expect(';');
    }
    if (!consume(')')) {
      node.inc = expr();
      expect(')');
    }
    node.then = stmt();
    return node;
  }

  
  if (consume('{')) {
    const head = {next: null} as Node;
    let cur = head;

    while (!consume('}')) {
      cur.next = stmt();
      cur = cur.next;
    }
    node = newNode(NodeKind.Block);
    node.body = head.next;
    return node;
  }

  node = expr();
  expect(';');
  return node;
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
  if (consume('&'))
    return newNodeUnary(NodeKind.Addr, unary());
  if (consume('*'))
    return newNodeUnary(NodeKind.Deref, unary());
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
    if (consume('(')) {
      const node = newNode(NodeKind.Funcall);
      node.funcname = token.str;
      node.args = funcargs();
      return node;
    }

    let var_ = findVar(token.str);
    if (!var_) var_ = newVar(token.str);
    return newNodeVar(var_);
  }

	return newNodeNum(expectNum());
}

function funcargs(): Node | null | undefined {
  if (consume(')'))
    return null;
  const head = assign();
  let cur = head;
  while (consume(',')) {
    cur.next = assign();
    cur = cur.next;
  }
  expect(')');
  return head;
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

function expectIdent(): string {
  if (global.token?.kind !== TokenKind.Ident)
    error('Expected identifier');
  const value = global.token?.value;
  global.token = global.token?.next;
  return value as string;
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
    init: null,
    inc: null,
    body: null,
    funcname: null,
    args: null,
	};
}

function newNodeUnary(kind: NodeKind, lhs: Node | null | undefined): Node {
  const node = newNode(kind);
  node.lhs = lhs;
  return node;
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

function newVarList(): VarList {
  return {var: null, next: null};
}

function newVar(name: string): Var {
  const var_: Var = {
    name,
    offset: 0,
  };
  const vl = {
    var: var_,
    next: locals,
  }
  locals = vl;
  return var_;
}

function findVar(name: string): Var | null | undefined {
  for (let vl = locals; vl; vl = vl.next)
    if (vl.var?.name === name)
      return vl.var;
  return null;
}

function newFunc(name: string): Func {
  return {
    name,
    next: null,
    node: null,
    locals: null,
    params: null,
    stackSize: 0,
  };
}

