#!/bin/bash

assert() {
  expected="$1"
  input="$2"

	node build/src/main.js "$input" > tmp.s
  # cat tmp.s
  cc -o tmp tmp.s
  ./tmp
  actual="$?"

  if [ "$actual" = "$expected" ]; then
    echo "$input => $actual"
  else
    echo "$input => $expected expected, but got $actual"
    exit 1
  fi
}

trap 'rm -f tmp tmp.s' EXIT

pnpm run build

assert 0 '0;'
assert 42 '42;'
assert 21 "5+20-4;"
assert 41 " 12 + 34 - 5 ;"
assert 47 '5+6*7;'
assert 15 '5*(9-6);'
assert 4 '(3+5)/2;'
assert 10 '-10+20;'
assert 10 '- -10;'
assert 10 '+ +10;'
assert 10 '- - +10;'

assert 0 '0==1;'
assert 1 '42==42;'
assert 1 '0!=1;'
assert 0 '42!=42;'

assert 1 '0<1;'
assert 0 '1<1;'
assert 0 '2<1;'
assert 1 '0<=1;'
assert 1 '1<=1;'
assert 0 '2<=1;'

assert 1 '1>0;'
assert 0 '1>1;'
assert 0 '1>2;'
assert 1 '1>=0;'
assert 1 '1>=1;'
assert 0 '1>=2;'

assert 3 'a=3;'
assert 8 'a=3;b=5;a+b;'

assert 8 'foo=3;bar=5;foo+bar;'

assert 3 'return 3;'
assert 8 'foo=3;bar=5;return foo+bar; 100;'

assert 3 'if (0) return 2; return 3;'
assert 2 'if(1)return 2;return 3;'

assert 3 'a=3; b=5; if (a + 1 < b) return a; return b;'

assert 3 'if (0) 2; else 3;'
assert 2 'if (1) 2; else 3;'

echo OK
