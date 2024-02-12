import { Node, NodeKind } from './parse.js';

// Pushes the given node's address to the stack.
function genLval(node: Node | null | undefined) {
  if (node?.kind == NodeKind.Lvar) {
    if (!node.name) throw new Error('node.name is null');

    console.log('	mov rax, rbp');
    console.log(`	sub rax, ${node.offset}`);
    console.log('	push rax');
  }
}

export function gen(node: Node | undefined | null): void {
	if (node === null || node === undefined) return;

  switch (node.kind) {
    case NodeKind.Num:
      console.log(`# num`);
      console.log(`	push ${node.val}`);
      return;
    case NodeKind.Lvar:
      console.log(`# lvar -- start`);
      genLval(node);
      console.log('	pop rax');
      console.log('	mov rax, [rax]');
      console.log('	push rax');
      console.log(`# lvar -- end`);
      return;
    case NodeKind.Assign:
      console.log(`# assign -- start`);
      console.log('# assign lhs -- start');
      genLval(node.lhs);
      console.log('# assign lhs -- end');
      console.log('# assign rhs -- start');
      gen(node.rhs);
      console.log('# assign rhs -- end');

      console.log('# assing exec -- start');
      console.log('	pop rdi');
      console.log('	pop rax');
      console.log('	mov [rax], rdi');
      console.log('	push rdi');
      console.log('# assing exec -- end');
      return;
    case NodeKind.Return:
      console.log(`# return -- start`);
      gen(node.lhs);
      console.log('	pop rax');
      console.log('	mov rsp, rbp');
      console.log('	pop rbp');
      console.log('	ret');
      console.log(`# return -- end`);
    return;
  }

	gen(node.lhs);
	gen(node.rhs);

  console.log(`# ${node.kind} -- start`);
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
    case NodeKind.Eq:
      console.log('	cmp rax, rdi');
      console.log('	sete al');
      console.log('	movzb rax, al');
      break;
    case NodeKind.Ne:
      console.log('	cmp rax, rdi');
      console.log('	setne al');
      console.log('	movzb rax, al');
    break;
    case NodeKind.Lt:
      console.log('	cmp rax, rdi');
      console.log('	setl al');
      console.log('	movzb rax, al');
    break;
    case NodeKind.Le:
      console.log('	cmp rax, rdi');
      console.log('	setle al');
      console.log('	movzb rax, al');
    break;
	}

	console.log('	push rax');

  console.log(`# ${node.kind} -- end`);
}
