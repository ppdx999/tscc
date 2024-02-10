import global from "./global.js";
import { tokenize } from "./tokenize.js";
import { parse } from "./parse.js";
import { gen } from "./codegen.js";

/*
 * EBNF
 *   expr       = equality
 *   equality   = relational ("==" relational | "!=" relational)*
 *   relational = add ("<" add | "<=" add | ">" add | ">=" add)*
 *   add        = mul ("+" mul | "-" mul)*
 *   mul        = primary ("*" primary | "/" primary)*
 *   unary      = "+"? primary | "-" primary
 *   primary    = num | "(" expr ")"
 *   num        = [0-9]+
 */

function main(args: string[]): void {
	if (args.length !== 1) {
		console.error('Invalid number of arguments');
		process.exit(1);
	}

  global.userInput = args[0];
	global.token = tokenize(global.userInput);
	const node = parse();
	
	console.log('.intel_syntax noprefix');
	console.log('.global main');
	console.log('main:');

	gen(node);

	console.log('	pop rax');
	console.log('	ret');
}

main(process.argv.slice(2));
