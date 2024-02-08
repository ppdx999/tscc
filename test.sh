#!/bin/bash

assert() {
  expected="$1"
  input="$2"

	node build/src/main.js "$input" > tmp.s
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

assert 0 0
assert 42 42

echo OK
