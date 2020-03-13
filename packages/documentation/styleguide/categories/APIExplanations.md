
## Flow involved in performing deposit(), send() and withdraw()
The API methods of deposit(), send() and withdraw() are the main methods by which developers will make use of the AZTEC SDK to enable zero-knowledge, confidential transactions. This section gives a short overview of how these methods work under the hood.  

### Overview of how they work
At a high level each of these methods results in the following happening:
1) Proof construction - zero-knowledge proof attesting to the correctness of the intended confidential transaction occurs locally on the client, in browser
2) Connection to Ethereum - the SDK connects to the Ethereum blockchain, via web3.js, and sends the proof as part of a transaction
3) Proof verification - validates the proof on chain
4) Implementation of relevant logic - the intended logic is implemented

Each of these methods constructs a zero-knowledge proof on the client locally and then sends it as an Ethereum transaction to the blockchain in order to be validated. Once the proof is validated Following this, the relevant intended logic is implemented. 


### .deposit()
This API makes use of a joinSplit zero-knowledge proof. It takes the given number of public ERC20 tokens, zero input notes and constructs the appropriate number of output notes. The output notes are encrypted representations of value - their value is confidential. 

The proof is constructed locally in browser on the client, before being sent as an Ethereum transaction using web3.js to the Ethereum blockchain. 
### .send()


### .withdraw()


### .balance()


### .createNoteFromBalance()


### .fetchNotesFromBalance()

### .balanceOfLinkedToken()

### .allowanceOfLinkedToken()

### .totalSupplyOfLinkedToken()

## Note
