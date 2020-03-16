A standard flow in using AZTEC involves 4 key stages:
- _(local)_ __Proof construction__: construct a zk proof attesting to the correctness of a transaction. This happens locally, often in the browser
- _(local)_ __Connect to the Ethereum blockchain__: Send the desired transaction, calling a `ZkAsset` method with the appropriate proof data
- _(on-chain)_ __Validate the proof__: validate that the proof is correct and valid
- _(on-chain)_ __Perform relevant logic__: once the proof has been validated, perform the relevant logic


## 1) Proof construction
A proof must be constructed, and the associated cryptographic `proofData` extracted. This attests to the correctness of the transaction that the user is wishing to perform. It is constructed locally on the client, using either the low level `aztec.js` package or the Aztec SDK (depending on the Dapp's engineering).

## 2) Connect to the Ethereum blockchain
The `proofData` is encoded and sent to the Ethereum blockchain, using `web3.js` in `aztec.js`. The transaction will likely call a method on the `ZkAsset` - `confidentialTransfer()` or `confidentialTransferFrom()` for example.

## 3) Validate the proof
The supplied proof will be validated. For example, if `confidentialTransfer()` was called then the `proofData` will be routed by ACE to the appropriate proof validator, which then performs validation. 

## 4) Perform relevant logic
Once the proof has been validated, the appropriate logic is implemented - this may mean for example that a confidential transaction is performed. 

&nbsp
&nbsp

## Visual representation of architecture
The below diagram gives an overview of how the key smart contract infrastructure interacts with a standard flow as above:

&nbsp
&nbsp
&nbsp

<img src="../../images/architectureOverview.png" width="75%">

