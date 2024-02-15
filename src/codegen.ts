import { Node, NodeKind, Program } from './type.js';

function genAddr(node: Node | null | undefined) {
  if (node?.kind == NodeKind.Var) {
    if (!node.var?.name) throw new Error('node.name is null');
    console.log(`  lea rax, [rbp-${node.var.offset}]`);
    console.log('  push rax');
    return;
  }

  throw new Error('genAddr: node.kind is not Var');
}

function load() {
  console.log('	pop rax');
  console.log('	mov rax, [rax]');
  console.log('	push rax');
}

function store() {
  console.log('	pop rdi');
  console.log('	pop rax');
  console.log('	mov [rax], rdi');
  console.log('	push rdi');
}

export function codegen(prog: Program) {
	console.log('.intel_syntax noprefix');
	console.log('.global main');
	console.log('main:');

  console.log('# prologue main -- start')
  console.log('	push rbp');
  console.log('	mov rbp, rsp');
  console.log(`	sub rsp, ${prog.stackSize}`);
  console.log('# prologue main -- end')

  for (let node = prog.node; node; node = node.next) {
    gen(node);
    console.log('	pop rax');
  }

  console.log('# epilogue main -- start');
  console.log('	mov rsp, rbp');
  console.log('	pop rbp');
	console.log('	ret');
  console.log('# epilogue main -- end');
}

let labelseq = 0;

function gen(node: Node | undefined | null): void {
	if (node === null || node === undefined) return;

  switch (node.kind) {
    case NodeKind.Num:
      console.log(`# num`);
      console.log(`	push ${node.val}`);
      return;
    case NodeKind.Var:
      console.log(`# lvar -- start`);
      genAddr(node);
      load();
      console.log(`# lvar -- end`);
      return;
    case NodeKind.Assign:
      genAddr(node.lhs);
      gen(node.rhs);
      store();
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
    case NodeKind.If:
      console.log(`# if -- start`);
      const seq = labelseq++;
      if (node.els) {
        gen(node.cond);
        console.log('	pop rax');
        console.log('	cmp rax, 0');
        console.log(`	je .Lelse${seq}`);
        gen(node.then);
        console.log(`	jmp .Lend${seq}`);
        console.log(`.Lelse${seq}:`);
        gen(node.els);
        console.log(`.Lend${seq}:`);
      } else {
        gen(node.cond);
        console.log('	pop rax');
        console.log('	cmp rax, 0');
        console.log(`	je .Lend${seq}`);
        gen(node.then);
        console.log(`.Lend${seq}:`);
      }
      console.log(`# if -- end`);
      return;
    case NodeKind.While:
      console.log(`# while -- start`);
      const seq2 = labelseq++;
      console.log(`.Lbegin${seq2}:`);
      gen(node.cond);
      console.log('	pop rax');
      console.log('	cmp rax, 0');
      console.log(`	je .Lend${seq2}`);
      gen(node.then);
      console.log(`	jmp .Lbegin${seq2}`);
      console.log(`.Lend${seq2}:`);
      console.log(`# while -- end`);
      return;
    case NodeKind.For:
      console.log(`# for -- start`);
      const seq3 = labelseq++;
      if (node.init) {
        gen(node.init);
        console.log('	pop rax');
      }
      console.log(`.Lbegin${seq3}:`);
      if (node.cond) {
        gen(node.cond);
        console.log('	pop rax');
        console.log('	cmp rax, 0');
        console.log(`	je .Lend${seq3}`);
      }
      gen(node.then);
      if (node.inc) {
        gen(node.inc);
        console.log('	pop rax');
      }
      console.log(`	jmp .Lbegin${seq3}`);
      console.log(`.Lend${seq3}:`);
      console.log(`# for -- end`);
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
