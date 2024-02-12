export const TokenKind = {
	Reserved: 'Reserved',
  Ident: 'Ident',
	Num: 'Num',
	EOF: 'EOF',
};

export type TokenKind = typeof TokenKind[keyof typeof TokenKind];

export type Token = {
	kind: TokenKind;
	value: string;
	next: Token | null | undefined;
	str: string;
  pos: number;
};

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

export type NodeKind = typeof NodeKind[keyof typeof NodeKind];

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
