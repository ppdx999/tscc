import global from "./global.js";
import { tokenize } from "./tokenize.js";
import { program } from "./parse.js";
import { gen } from "./codegen.js";

/*
 * EBNF
 *   program    = stmt*
 *   stmt       = expr ";"
 *              | "return" expr ";"
 *              | "if" "(" expr ")" stmt ( "else" stmt )?
 *              | "while" "(" expr ")" stmt
 *              | "for" "(" expr? ";" expr? ";" expr? ")" stmt
 *   expr       = assign
 *   assign     = equality ("=" assign)?
 *   equality   = relational ("==" relational | "!=" relational)*
 *   relational = add ("<" add | "<=" add | ">" add | ">=" add)*
 *   add        = mul ("+" mul | "-" mul)*
 *   mul        = primary ("*" primary | "/" primary)*
 *   unary      = "+"? primary | "-" primary
 *   primary    = num | ident | "(" expr ")"
 *   ident      = [a-zA-Z_][a-zA-Z0-9_]*
 *   num        = [0-9]+
 */

function main(args: string[]): void {
	if (args.length !== 1) {
		console.error('Invalid number of arguments');
		process.exit(1);
	}

  global.userInput = args[0];
	global.token = tokenize(global.userInput);
  program();
	
	console.log('.intel_syntax noprefix');
	console.log('.global main');
	console.log('main:');

  console.log('# prologue main -- start')
  console.log('	push rbp');
  console.log('	mov rbp, rsp');
  console.log(`	sub rsp, ${global.locals?.offset ?? 0}`)
  console.log('# prologue main -- end')

  for (let i = 0; global.nodes[i]; i++) {
    console.log(`# node ${i} -- start`);
    gen(global.nodes[i]);
    
    console.log('	pop rax');

    console.log(`# node ${i} -- end`);
  }

  console.log('# epilogue main -- start');
  console.log('	mov rsp, rbp');
  console.log('	pop rbp');
	console.log('	ret');
  console.log('# epilogue main -- end');

}

main(process.argv.slice(2));
