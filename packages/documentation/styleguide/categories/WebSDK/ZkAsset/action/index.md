
The SDK ships with three main function providing methods:
- `async deposit()`
- `async send()`
- `async withdraw()`

These methods allow developers to build dapps tha convert DAI into zkDAI, send zkDAI to users and convert zkDAI back into DAI. They are the main methods whereby developers will make use of the AZTEC SDK to enable zero-knowledge, confidential transactions. This section gives a short overview of how these methods work under the hood.  
 

### How they work under the hood
At a high level each of these methods results in the following happening:
1) (Local) Proof construction - zero-knowledge proof attesting constructed locally in the browser. The proof attests to the correctness of the intended confidential transaction
2) (Local) Connection to Ethereum - the SDK connects to the Ethereum blockchain and sends the proof as part of a transaction
3) (On-chain) Proof verification - validates the proof on chain
4) (On-chain) Implementation of relevant logic - the intended logic is implemented

