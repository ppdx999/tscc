import { Node, NodeKind } from './parse.js';

export function gen(node: Node | undefined | null): void {
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
}
