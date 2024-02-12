import { error } from "./util.js";

export const TokenKind = {
	Reserved: 'Reserved',
  Ident: 'Ident',
	Num: 'Num',
	EOF: 'EOF',
  Return: 'Return',
};

export type TokenKind = typeof TokenKind[keyof typeof TokenKind];

export type Token = {
	kind: TokenKind;
	value: string;
	next: Token | null | undefined;
	str: string;
  pos: number;
};

function isNumber(char: string | null): boolean {
	return char !== null && char.match(/[0-9]/) !== null;
}

function isSpace(char: string | null): boolean {
	return char !== null && char === ' ';
}

function isAlphabet(char: string | null): boolean {
  return char !== null && char.match(/[a-zA-Z]/) !== null;
}

function isAlnum(char: string | null): boolean {
  return char !== null && char.match(/[a-zA-Z0-9]/) !== null;
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

    if (str.startsWith('return', p) && !isAlnum(str[p + 6])) {
      cur = newToken(TokenKind.Return, cur, 'return', p);
      p += 6;
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
