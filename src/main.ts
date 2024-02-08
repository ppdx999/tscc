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
};


let token: Token | null | undefined = null;

function error(...args: any[]) {
	console.error(...args);
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

function newToken(kind: TokenKind, cur: Token | null | undefined, str: string): Token {
	const token: Token = {
		kind,
		value: str,
		next: null,
		str
	};
	if (cur) cur.next = token;
	return token;
}

function tokenize(str: string): Token | null | undefined {
	const head: Token | null | undefined = {
		kind: TokenKind.Reserved,
		value: '',
		next: null,
		str: ''
	};
	let cur = head;

	let p = 0;
	while (p < str.length) {
		if (isSpace(str[p])) {
			p++;
			continue;
		}

		if (str[p] === '+' || str[p] === '-') {
			cur = newToken(TokenKind.Reserved, cur, str[p]);
			p++;
			continue;
		}

		if (isNumber(str[p])) {
			let num = '';
			while (isNumber(str[p])) {
				num += str[p];
				p++;
			}
			cur = newToken(TokenKind.Num, cur, num);
			continue;
		}

		error(`Invalid token: ${str[p]}`);
	}
	cur = newToken(TokenKind.EOF, cur, '');
	return head.next;
}

function main(args: string[]): void {
	if (args.length !== 1) {
		console.error('Invalid number of arguments');
		process.exit(1);
	}

	token = tokenize(args[0]);
	console.log('.intel_syntax noprefix');
	console.log('.global main');
	console.log('main:');
	console.log(` mov rax, ${expectNum()}`);

	while (!atEof()) {
		if (consume('+')) {
			console.log(` add rax, ${expectNum()}`);
			continue;
		}
		if (consume('-')) {
			console.log(` sub rax, ${expectNum()}`);
			continue;
		}
		error('Unexpected token');
	}
	console.log('	ret');
}

main(process.argv.slice(2));
