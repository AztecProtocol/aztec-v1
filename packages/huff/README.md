## **Huff**: a programming language for the Ethereum Virtual Machine

<p align="center"><img src="https://i.imgur.com/SVRjUhU.png" width="640px"/></p>

Huff is a domain-specific language created for the purposes of writing highly optimized Ethereum Virtual Machine program code and, ultimately, smart contracts.

Huff enables the construction of EVM assembly macros - blocks of bytecode that can be rigorously tested and evaluated. Macros can themselves be composed of Huff macros.

Huff doesn't hide the workings of the EVM behind syntactic sugar. In fact, Huff doesn't hide anything at all. Huff does not have variables, instead directly exposing the EVM's program stack to the developer to be directly manipulated.

### **"Wait...that sounds terrible! What is the point of huff?"**

I developed Huff while writing [weierstrudel](https://github.com/AztecProtocol/weierstrudel/tree/master/huff_modules), an elliptic curve arithmetic library. Huff is designed for developing highly optimized algorithms where direct manipulation of the program's bytecode is preferred.

Huff supports a form of templating - Huff macros can accept template parameters, which in turn are Huff macros. This allows for customizable macros that are ideal for loop unrolling.

Huff algorithms can be broken down into their constituent macros and rigorously tested without having to split the algorithm into functions and invoke jump instructions.

### **Huff syntax**

There are only two fundamental building blocks to a Huff program:

-   Macros
-   Jump tables (and packed jump tables)
-   (TODO: add bytecode tables)

### **Macros**

Some example macros:

```
#define macro P = takes(0) returns(1) {
    0x30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47
}

#define macro P_LOCATION = takes(0) returns(1) {
    0x20
}

#define macro GET_P = takes(0) returns(1) {
    P_LOCATION() mload
}

template <p1,p2>
#define macro POINT_DOUBLE = takes(3) returns(3) {
    <p1> dup3 callvalue shl
    swap3 dup4 mulmod
    <p2> dup2 callvalue shl
    dup2 dup1 dup1 dup4 dup10
    mulmod dup2 sub swap8
    dup1 mulmod 0x03 mul
    dup2 dup2 dup1
    mulmod dup9 callvalue shl add swap8
    dup9 add mulmod swap3 mulmod add swap2
    <p2> swap2 mulmod <p1> sub
}

#define macro POINT_DOUBLE_IMPLEMENTATIONS = takes(3) returns(3) {
    P()
    dup1 P_LOCATION() mstore
    0x01 // x
    0x02 // y
    0x01 // z
    POINT_DOUBLE<dup4, dup5>()
    POINT_DOUBLE<P, P>()
    POINT_DOUBLE<GET_P, P>()
}
```

The `takes` parameter defines the number of items the macro expects to be on the stack.  
The `returns` parameter defines the number of items the macro will leave on the stack (including the items from `takes`).  
These fields are for illustrative purposes only - they are not enforced by the compiler, as that would inhibit macros where the stack state is unknowable at compile time. Some languages might consider that a negative, but not Huff.

### **Jump tables**

Huff supports tables of jump destinations integrated directly into the contract bytecode. This is to enable efficient program execution flows by using jump tables instead of conditional branching.

An example:

```
#define jumptable JUMP_TABLE {
    lsb_0 lsb_1 lsb_2 lsb_1 lsb_3 lsb_1
    lsb_2 lsb_1 lsb_4 lsb_1 lsb_2 lsb_1
    lsb_3 lsb_1 lsb_2 lsb_1
}

#define macro EXAMPLE = takes(0) returns(0) {
    0x01
    __tablesize(JUMP_TABLE) __tablestart(JUMP_TABLE) 0x00 codecopy
    0x00 calldataload mload jump

    lsb_0:
        0x01 add
    lsb_1:
        0x02 add
    lsb_2:
        0x03 add
    lsb_3:
        0x04 add
    lsb_4:
        0x05 add
}
```

Jump labels will by default occupy 32-bytes of space in the contract bytecode. Packed jump tables, where each label occupies 2 bytes, can be created via `#define jumptable__packed`.

### **Additional features**

Huff currently supports three pieces of syntactic sugar:

-   `__codesize(MACRO_NAME)` will push the size of a given macro (in bytes) onto the stack.
-   `__tablesize(TABLE_NAME)` will push the size of a given table (in bytes) onto the stack.
-   `__tablestart(TABLE_NAME)` will push the offset (in bytes) between the start of the contract's bytecode and the location of the given table onto the stack.

In addition, when supplying templated arguments to a macro, `+`, `-` and `*` operators can be used if the operands are literals that are known at compile time. For example:

```
template<p1>
#define macro FOO = takes(0) returns(0) {
    <p1> swap pop 0x01 mulmod
}

#define macro FOO_SIZE = takes(0) returns(0) {
    __codesize(FOO<0x01>)
}

#define macro P = takes(0) returns(0) {
    0x20
}

#define macro BAR = takes(0) returns(0) {
    FOO<FOO_SIZE+P>()     // valid Huff code
    FOO<0x10*FOO_SIZE>()  // valid Huff code
    FOO<FOO+0x10>()       // invalid Huff code
}
```

Literals can be expressed in either decimal form or hexadecimal form (prepended by `0x`).  
`push` opcodes are not used in Huff - literals used directly inside Huff code will be replaced with the smallest suitable `push` instruction by the compiler.

### **"Where can I find example Huff code?"**

[weierstrudel](https://github.com/AztecProtocol/weierstrudel/tree/master/huff_modules) is an elliptic curve arithmetic library written entirely in Huff, with its contract code totalling over 14kb.

### **"...Why is it called Huff?"**

Huff is a game played on a chess-board. One player has chess pieces, the other draughts pieces. The rules don't make any sense, the game is deliberately confusing and it is an almost mathematical certainty that the draughts player will lose. You won't find any reference to it online, because it was `invented' in a pub by some colleagues of mine in a past career and promptly forgotten about for being a terrible game.

I found that writing Huff macros invoked similar emotions to playing Huff, hence the name.

### **"Despite everything I've just read I have a compelling desire to use Huff...can I contribute?"**

Please, by all means. Huff is open-source and licensed under LGPL-3.0.

### **Usage**

```js
const { Runtime } = require('huff');

const main = new Runtime('main_loop.huff', 'path_to_macros');
const calldata = [
    // calldata for macro
    { index: 0, value: new BN(1) },
    { index: 32, value: new BN(2) },
];
const initialMemory = [
    // intial memory state expected by macro
    { index: 0, value: new BN(1234134) },
    { index: 32, value: new BN(29384729832) },
];
const inputStack = [new BN(1), new BN(6)]; // initial stack state expected by macro
const callvalue = 1; // amount of wei in transaction
const { stack, memory, gas, bytecode, returnData } = await main('MACRO_NAME', initialStack, initialMemory, calldata, callvalue);

console.log('gas cost when executing macro = ', gas);
console.log('macro bytecode = ', bytecode);
console.log('macro return data = ', returnData);
console.log('output stack state = ', stack);
console.log('output memory state = ', memory);
```
