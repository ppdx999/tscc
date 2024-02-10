let i = 0;
const auto = () => i++;

const TokenKind = {
	Reserved: auto(),
	Num: auto(),
	EOF: auto(),
};

type TokenKind = typeof TokenKind[keyof typeof TokenKind];


type Token = {
	kind: TokenKind;
	value: string;
	next: Token | null | undefined;
	str: string;
  pos: number;
};

let token: Token | null | undefined = null;
let userInput = '';

function error(...args: any[]) {
  console.error(userInput);
  console.error(' '.repeat(token?.pos as number) + '^', ...args);

	process.exit(1);
}

function consume(op: string): boolean {
	if (token?.kind !== TokenKind.Reserved || token?.value !== op) 
		return false;
	token = token?.next;
	return true;
}

function expect(op: string): void {
	if (token?.kind !==  TokenKind.Reserved || token?.value !== op) 
		error(`Expected ${op}`);
	token = token?.next;
}

function expectNum(): number {
	if (token?.kind !== TokenKind.Num)
		error('Expected number');
	const value = parseInt(token?.value as string);
	token = token?.next;
	return value;
}

const number = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function isNumber(char: string | null): boolean {
	return char !== null && number.includes(char);
}

function isSpace(char: string | null): boolean {
	return char !== null && char === ' ';
}

function atEof(): boolean {
	return token?.kind === TokenKind.EOF;
}

function newToken(kind: TokenKind, cur: Token | null | undefined, str: string, pos: number): Token {
	const token: Token = {
		kind,
		value: str,
		next: null,
		str,
    pos,
	};
	if (cur) cur.next = token;
	return token;
}

function tokenize(str: string): Token | null | undefined {
	const head: Token | null | undefined = {
		kind: TokenKind.Reserved,
		value: '',
		next: null,
		str: '',
    pos: 0,
	};
	let cur = head;

	let p = 0;
	while (p < str.length) {
		if (isSpace(str[p])) {
			p++;
			continue;
		}

		if (['+', '-', '*', '/', '(', ')'].includes(str[p])) {
			cur = newToken(TokenKind.Reserved, cur, str[p], p);
			p++;
			continue;
		}

		if (isNumber(str[p])) {
			let num = '';
      let pos = p;
			while (isNumber(str[p])) {
				num += str[p];
				p++;
			}
			cur = newToken(TokenKind.Num, cur, num, pos);
			continue;
		}

		error(`Invalid token: ${str[p]}`);
	}
	cur = newToken(TokenKind.EOF, cur, '', p);
	return head.next;
}


/*
 * expr    = mul ("+" mul | "-" mul)*
 * mul     = primary ("*" primary | "/" primary)*
 * unary   = "+"? primary | "-" primary
 * primary = num | "(" expr ")"
 * num     = [0-9]+
 */

const NodeKind = {
	Add: auto(),
	Sub: auto(),
	Mul: auto(),
	Div: auto(),
	Num: auto(),
};

type NodeKind = typeof NodeKind[keyof typeof NodeKind];

type Node = {
	kind: NodeKind;
	lhs: Node | null | undefined;
	rhs: Node | null | undefined;
	val: number;
};

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

function expr(): Node {
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
    return newNode(NodeKind.Sub, newNodeNum(0), primary(), 0);
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


function gen(node: Node | undefined | null): void {
	if (node === null || node === undefined) return;

	if (node.kind === NodeKind.Num) {
		console.log(`	push ${node.val}`);
		return;
	}

	gen(node.lhs);
	gen(node.rhs);

	console.log('	pop rdi');
	console.log('	pop rax');

	switch (node.kind) {
		case NodeKind.Add:
			console.log('	add rax, rdi');
			break;
		case NodeKind.Sub:
			console.log('	sub rax, rdi');
			break;
		case NodeKind.Mul:
			console.log('	imul rax, rdi');
			break;
		case NodeKind.Div:
			console.log('	cqo');
			console.log('	idiv rdi');
			break;
	}

	console.log('	push rax');
}

function main(args: string[]): void {
	if (args.length !== 1) {
		console.error('Invalid number of arguments');
		process.exit(1);
	}

  userInput = args[0];
	token = tokenize(userInput);
	const node = expr();
	
	console.log('.intel_syntax noprefix');
	console.log('.global main');
	console.log('main:');

	gen(node);

	console.log('	pop rax');
	console.log('	ret');
}

main(process.argv.slice(2));
