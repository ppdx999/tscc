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
  Addr: 'Addr',
  Deref: 'Deref',
  Var: 'Var',
	Num: 'Num',
  Eq: 'Eq',
  Ne: 'Ne',
  Lt: 'Lt',
  Le: 'Le',
  Return: 'Return',
  If: 'If',
  While: 'While',
  For: 'For',
  Block: 'Block',
  Funcall: 'Funcall',
};

export type NodeKind = typeof NodeKind[keyof typeof NodeKind];

export type Node = {
	kind: NodeKind;
  next: Node | null | undefined;
	lhs: Node | null | undefined;
	rhs: Node | null | undefined;
  var: Var | null | undefined;
	val: number | null | undefined;
  cond: Node | null | undefined;
  then: Node | null | undefined;
  els: Node | null | undefined;
  init: Node | null | undefined;
  inc: Node | null | undefined;
  body: Node | null | undefined;
  funcname: string | null | undefined;
  args: Node | null | undefined;
};

export type Var = {
  name: string;
  offset: number;
}

export type VarList = {
  next: VarList | null | undefined;
  var: Var | null | undefined;
}

export type Func = {
  next: Func | null | undefined;
  name: string;
  node: Node | null | undefined;
  locals: VarList | null | undefined;
  params: VarList | null | undefined;
  stackSize: number;
};
