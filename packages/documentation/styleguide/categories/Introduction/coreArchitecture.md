There are three key components of the AZTEC smart contract system - the AZTEC Cryptography Engine, proof validators, and ZkAssets.

## AZTEC Cryptography Engine (ACE)
ACE can be thought of as the 'brain' of the AZTEC smart contract system, it is the coordinating smart contract. Specifically, ACE has two main responsibilities:
- delegate the verification of zk proofs to the appropriate smart contract 
- process state update instructions from succesfully validated proofs

_Contract_: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/ACE/ACE.sol 

## Proof validators
There is a proof validator contract for each AZTEC zero-knowledge proof (of which there are 7). It is the responsibility of the validator to verify a supplied proof and so confirm the legitimacy of a proposed action. 

These validator contracts are linked to ACE. 

_Contract_: https://github.com/AztecProtocol/AZTEC/tree/develop/packages/protocol/contracts/ACE/validators 

## ZkAssets
ZkAssets can be thought of as a confidential version of an ERC20 contract, with an example being zkDAI. They are used to store user's funds in note registries and to perform confidential transactions, using methods such as `confidentialTransfer()` and `confidentialTransferFrom()` - these methods require an appropriate proof to be validated.

_Contracts_: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/ERC1724/base/ZkAssetBase.sol 




