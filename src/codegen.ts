import { Node, NodeKind, Func } from './type.js';

let labelseq = 0;
let funcname: string | null = null;

const argreg = ['rdi', 'rsi', 'rdx', 'rcx', 'r8', 'r9'];

function genAddr(node: Node | null | undefined) {
  if (node?.kind == NodeKind.Var) {
    if (!node.var?.name) throw new Error('node.name is null');
    console.log(`  # genAddr: ${node.var.name}`);
    console.log(`  lea rax, [rbp-${node.var.offset}]`);
    console.log('  push rax');
    return;
  }

  throw new Error('genAddr: node.kind is not Var');
}

function load() {
  console.log('  # load')
  console.log('  pop rax');
  console.log('  mov rax, [rax]');
  console.log('  push rax');
}

function store() {
  console.log('  # store')
  console.log('  pop rdi');
  console.log('  pop rax');
  console.log('  mov [rax], rdi');
  console.log('  push rdi');
}

export function codegen(prog: Func | null | undefined) {
  console.log('.intel_syntax noprefix');
  for (let fn = prog; fn; fn = fn.next) {
    funcname = fn.name;
    console.log(`.global ${funcname}`);
    console.log(`${funcname}:`);

    // Prologue
    console.log('  push rbp');
    console.log('  mov rbp, rsp');
    console.log(`  sub rsp, ${fn.stackSize}`);

    // Push arguments to the stack
    let i = 0;
    for (let vl = fn.params; vl; vl = vl.next) {
      console.log(`  mov [rbp-${vl.var?.offset}], ${argreg[i++]}`);
    }

    // Emit code
    for (let node = fn.node; node; node = node.next) {
      gen(node);
    }

    // Epilogue
    console.log(`.L.return.${funcname}:`);
    console.log('  mov rsp, rbp');
    console.log('  pop rbp');
    console.log('  ret');
  }
}

function gen(node: Node | undefined | null): void {
  if (node === null || node === undefined) return;

  switch (node.kind) {
    case NodeKind.Num:
      console.log(`# num`);
      console.log(`  push ${node.val}`);
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
    case NodeKind.Funcall:
      let nargs = 0;
      for (let arg = node.args; arg; arg = arg.next) {
        gen(arg);
        nargs++;
      }

      for (let i = nargs - 1; i >= 0; i--) {
        console.log(`  pop ${argreg[i]}`);
      }

      // We need to align RSP to a 16 byte boundary before
      // calling a function because it is an ABI requirement.
      // RAX is set to 0 for variadic function.
      const seq4 = labelseq++;
      console.log('  mov rax, rsp');
      console.log('  and rax, 15');
      console.log('  jnz .Lcall' + seq4);
      console.log('  mov rax, 0');
      console.log(`  call ${node.funcname}`);
      console.log('  jmp .Lend' + seq4);
      console.log('.Lcall' + seq4 + ':');
      console.log('  sub rsp, 8');
      console.log('  mov rax, 0');
      console.log(`  call ${node.funcname}`);
      console.log('  add rsp, 8');
      console.log('.Lend' + seq4 + ':');
      console.log('  push rax');
      return;
    case NodeKind.Return:
      gen(node.lhs);
      console.log('  pop rax');
      console.log(`  jmp .L.return.${funcname}`);
    return;
    case NodeKind.If:
      console.log(`# if -- start`);
      const seq = labelseq++;
      if (node.els) {
        gen(node.cond);
        console.log('  pop rax');
        console.log('  cmp rax, 0');
        console.log(`  je .Lelse${seq}`);
        gen(node.then);
        console.log(`  jmp .Lend${seq}`);
        console.log(`.Lelse${seq}:`);
        gen(node.els);
        console.log(`.Lend${seq}:`);
      } else {
        gen(node.cond);
        console.log('  pop rax');
        console.log('  cmp rax, 0');
        console.log(`  je .Lend${seq}`);
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
      console.log('  pop rax');
      console.log('  cmp rax, 0');
      console.log(`  je .Lend${seq2}`);
      gen(node.then);
      console.log(`  jmp .Lbegin${seq2}`);
      console.log(`.Lend${seq2}:`);
      console.log(`# while -- end`);
      return;
    case NodeKind.For:
      console.log(`# for -- start`);
      const seq3 = labelseq++;
      if (node.init) {
        gen(node.init);
        console.log('  pop rax');
      }
      console.log(`.Lbegin${seq3}:`);
      if (node.cond) {
        gen(node.cond);
        console.log('  pop rax');
        console.log('  cmp rax, 0');
        console.log(`  je .Lend${seq3}`);
      }
      gen(node.then);
      if (node.inc) {
        gen(node.inc);
        console.log('  pop rax');
      }
      console.log(`  jmp .Lbegin${seq3}`);
      console.log(`.Lend${seq3}:`);
      console.log(`# for -- end`);
      return;
    case NodeKind.Block:
      let n: Node | undefined | null = node;
      for (n = node.body; n; n = n.next) {
        gen(n);
        console.log('  pop rax');
      }
      return;
  }

  gen(node.lhs);
  gen(node.rhs);

  console.log(`# ${node.kind} -- start`);
  console.log('  pop rdi');
  console.log('  pop rax');

  switch (node.kind) {
    case NodeKind.Add:
      console.log('  add rax, rdi');
      break;
    case NodeKind.Sub:
      console.log('  sub rax, rdi');
      break;
    case NodeKind.Mul:
      console.log('  imul rax, rdi');
      break;
    case NodeKind.Div:
      console.log('  cqo');
      console.log('  idiv rdi');
      break;
    case NodeKind.Eq:
      console.log('  cmp rax, rdi');
      console.log('  sete al');
      console.log('  movzb rax, al');
      break;
    case NodeKind.Ne:
      console.log('  cmp rax, rdi');
      console.log('  setne al');
      console.log('  movzb rax, al');
    break;
    case NodeKind.Lt:
      console.log('  cmp rax, rdi');
      console.log('  setl al');
      console.log('  movzb rax, al');
    break;
    case NodeKind.Le:
      console.log('  cmp rax, rdi');
      console.log('  setle al');
      console.log('  movzb rax, al');
    break;
  }

  console.log('  push rax');

  console.log(`# ${node.kind} -- end`);
}
