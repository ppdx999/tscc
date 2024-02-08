const args = process.argv.slice(2);

if (args.length !== 1) {
	console.error('Invalid number of arguments');
	process.exit(1);
}

console.log('.intel_syntax noprefix');
console.log('.global main');
console.log('main:');
console.log(` mov rax, ${args[0]}`);
console.log('	ret');
