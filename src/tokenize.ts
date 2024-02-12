import { auto, error } from "./util.js";

export const TokenKind = {
	Reserved: auto(),
  Ident: auto(),
	Num: auto(),
	EOF: auto(),
};

export type TokenKind = typeof TokenKind[keyof typeof TokenKind];

export type Token = {
	kind: TokenKind;
	value: string;
	next: Token | null | undefined;
	str: string;
  pos: number;
};

const number = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function isNumber(char: string | null): boolean {
	return char !== null && number.includes(char);
}

function isSpace(char: string | null): boolean {
	return char !== null && char === ' ';
}

function isAlphabet(char: string | null): boolean {
  return char !== null && char.match(/[a-zA-Z]/) !== null;
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

export function tokenize(str: string): Token | null | undefined {
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

    if (isAlphabet(str[p])) {
      let ident = '';
      let pos = p;
      while (isAlphabet(str[p])) {
      ident += str[p];
      p++;
      }
      cur = newToken(TokenKind.Ident, cur, ident, pos);
      continue;
    }

    if (
      str.startsWith('==', p) ||
      str.startsWith('!=', p) ||
      str.startsWith('<=', p) ||
      str.startsWith('>=', p)
    ) {
      cur = newToken(TokenKind.Reserved, cur, str.slice(p, p + 2), p);
      p += 2;
      continue;
    }


		if (['+', '-', '*', '/', '(', ')', '<', '>', '=', ';'].includes(str[p])) {
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
