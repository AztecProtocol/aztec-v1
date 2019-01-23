## **weierstrudel**: efficient elliptic curve arithmetic for smart contracts  

`weierstrudel` is a highly optimized smart contract that performs elliptic curve scalar multiplication on the short Weierstrass 254-bit Barreto-Naehrig curve, formerly used by ZCash and currently available as a precompile smart-contract in the Ethereum protocol.  

The current gas schedule for Ethereum's scalar multiplication precompile smart contract is `40,000` gas. When multiplying more than one point, weierstrudel is **substantially more efficient than the precompile contract** (see [Benchmarks](#benchmarks)).

### **Wait...what?**  

weierstrudel is written entirely in Huff, a low-level domain-specific language that compiles to Ethereum Virtual Machine opcodes. In addition, the following techniques are used to minimize gas costs:  

* Using the GLV technique to exploit a curve endomorphism and reduce the number of 'point doubling' operations in half.  
* Using Shamir's trick to combine multiple scalar multiplications into a single algorithm, fixing the number of 'point doubling' operations to ~127  
* Using Windowed-Non-Adjacent-Form representations for scalar multipliers, reducing the number of 'point addition' operations to ~44 per point  
* Using the difference between the bn254 curve's 254-bit field modulus and the EVM's 256 word size to defer modular reductions until absolutely neccessary  

`weierstrudel` makes extensive use of bit-shift opcodes and is only compatible with Ethereum once the Constantinople hard-fork has been activated.  

### **Hang on...what is Huff?**

Huff enables the construction of composable, EVM assembly macros. Huff also supports a crude form of templating - macros can accept template arguments, which in turn are also Huff macros. This allows for highly optimized, customizable blocks of assembly code.  

See the [Huff repository]() for more details.

### **What are the implications of weierstrudel?**

Until the gas schedule for Ethereum's precompile contracts changes, `weierstrudel` makes zero-knowledge cryptosystems that utilize the bn254 curve, such as the [AZTEC protocol]() substantially cheaper.

### **Is there a catch?**  

The `weierstrudel` smart contract requires precisely `1` wei to be sent to it or it will refuse to perform elliptic curve scalar multiplication. No more, no less.  

### **...really?**  

Yes. Doing so saves approximately 500 gas per contract call.

### **Is weierstrudel production ready?**

Not yet! We're in the process of applying more rigorous testing to ensure the correctness of `weierstrudel`'s algorithms. In addition we still need to implement the following:  

1. Fully supported edge-cases for weierstrudel's point addition formulae - currently the contract will throw an error if the following edge cases are hit:
    * Adding two points equal to one another
    * Adding a point to the point's negative counterpart
2. Montgomery batch inverses in Huff - points are currently expressed in Jacobean form.
    * Supplying a point's inverse as a transaction input is the most efficient method of obtaining an inverse (~2,000 gas), but we still want to implement this to maintain a consistent interface when compared to the precompile
3. Precomputed point lookup tables for generator points
    * There are substantial gas optimizations to be claimed by integrating a lookup table for bn254's fixed generator point

### **Can I use weierstrudel in my project?**  

Of course! `weierstrudel` is open-source software, licensed under LGPL-3.0. However we would urge caution until we've finished thoroughly validating `weierstrudel`'s Huff macros.

### **Benchmarks**

Gas estimates can be obtained by running `npm benchmark`

Number of points | Approximate gas cost (average of 10 runs) | Cost per point
--- | --- | ---
1 | 47,593 | 47,593
2 | 69,057 | 34,528
3 | 89,997 | 29,999
4 | 111,554 | 27,889
5 | 133,580 | 26,716
6 | 154,759 | 25,793
7 | 176,051 | 25,150
8 | 196,570 | 24,571
9 | 219,103 | 24,244
10 | 239,872 | 23,987
11 | 261,243 | 23,749
12 | 282,349 | 23,529
13 | 304,197 | 23,400
14 | 324,816 | 23,201
15 | 348,173 | 23,211

### **Deployed weierstrudel**

`weierstrudel` is currently deployed on [Ropsten](https://ropsten.etherscan.io/address/0xd68131a43ca870ce0a27f5ace6c696dd6c442683#code)

### **Usage**

Run weierstrudel tests via `npm run test`  
Run reference javascript methods via `npm run jstest`  
Run weierstrudel benchmarks via `npm run benchmark`  
Compile the weierstrudel smart contract via `npm run compile`
