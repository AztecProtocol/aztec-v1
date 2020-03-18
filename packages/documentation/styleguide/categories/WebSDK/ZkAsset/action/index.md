The SDK ships with three main function providing methods:

-   `async deposit()`
-   `async send()`
-   `async withdraw()`

These methods allow developers to build dapps that convert DAI into zkDAI, send zkDAI to other Ethereum addresses and convert zkDAI back into DAI. They are the main methods whereby developers will make use of the AZTEC SDK to enable zero-knowledge, confidential transactions. This section gives a short overview of how these methods work under the hood.

All three methods make use of the `joinSplit` proof, but with different variables for the input notes, public value and output notes. A user's balance of zkDAI is equal to the sum of the zkDAI notes they own.

## Overview: How they work under the hood

Each method executes the flow as outlined below:

-   **Proof construction**: a zero-knowledge `joinSplit` proof is constructed using notes that the user owns
-   **Transaction sending**: the SDK connects to the Ethereum blockchain and the transaction, with the proof included, via the gas station network. This means that the user does not need gas to interact with Aztec
-   **Proof verification**: `ace.validateProof()` is called. This results in ACE forwading the proof onto the `JoinSplitValidator.sol` in order to have the proof validated
-   **Implementation of relevant logic**: `ZkAsset.confidentialTransferFrom()` is called upon successful validation of the proof. This results in the `inputNotes` to the `joinSplit` being destroyed and the `outputNotes` being created in the zkDAI note registry. In this way, value has been confidentially transferred.

## deposit()

Uses a joinSplit zero-knowledge proof, to convert public DAI tokens into zkDAI tokens.

It takes the given number of public DAI tokens, zero input notes and constructs the appropriate number of output notes to represent zkDAI. The output notes ultimately represent zkDAI. The proof must satisfy a balancing relationship - the sum of input values must equal the sum of output notes.

Once constructed the proof is then sent as an Ethereum transaction to the blockchain, where it is validated.

Following this, DAI is transferred from the owner's Ethereum address to the AZTEC Cryptography Engine (ACE) smart contract. The relevant owner(s) are then simulatenously granted the corresponding quantity of zkDAI, represented on chain as AZTEC notes and stored in the note registry of the ZkAsset.

The result of successfully calling this method is that the user's DAI balance is decremented by the number of tokens they deposited, and the receiver's zkDAI balance is incremented accordingly.

## send()

Uses a joinSplit zero-knowledge proof, to send zkDAI from one user to another user.

The method takes as input notes representing the zkDAI balance to be transferred, and creates output notes with appropriate owners to represent the zkDAI balance that has been transferred. The total input zkDAI balance must equal the total output zkDAI balance - the SDK selects the combination of notes to make this the case.

The proof is then sent as an Ethereum transaction to the blockchain and validated. Upon successfull validation, the input zkDAI notes are destroyed and output zkDAI notes created.

The SDK listens for the appropriate events to update the sender and receiver's balances appropriately.

## withdraw()

Uses a joinSplit zero-knowledge proof to convert zkDAI back into public DAI tokens.

The method selects notes from the user's balance and passes them as inputs to the proof. There are no output notes (given that the user is withdrawing into public DAI) and a number of public DAI tokens specified.

Once the proof is validated, the input notes representing the zkDAI are destroyed in the note registry and DAI tokens transferred from the AZTEC cryptography engine (ACE) smart contract to the designated owner of the DAI
