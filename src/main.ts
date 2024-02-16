import global from "./global.js";
import { tokenize } from "./tokenize.js";
import { program } from "./parse.js";
import { codegen } from "./codegen.js";

/*
 * EBNF
 *   program    = stmt*
 *   stmt       = expr ";"
 *              | "{" stmt* "}"
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
  const prog = program();

  // Assign offset to local variables.
  let offset = 0;
  for (let var_ = prog.locals; var_; var_ = var_.next) {
    offset += 8;
    var_.offset = offset;
  }
  prog.stackSize = offset;

  codegen(prog)
}

main(process.argv.slice(2));
