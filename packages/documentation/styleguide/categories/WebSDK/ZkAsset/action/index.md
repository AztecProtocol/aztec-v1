The SDK ships with three main function providing methods:

-   `async deposit()`
-   `async send()`
-   `async withdraw()`

These methods allow developers to build dapps that convert DAI into zkDAI, send zkDAI to other Ethereum addresses and convert zkDAI back into DAI. They are the main methods whereby developers will make use of the AZTEC SDK to enable zero-knowledge, confidential transactions. This section gives a short overview of how these methods work under the hood.

All three methods make use of the `joinSplit` proof, but with different variables for the input notes, public value and output notes. A user's balance of zkDAI is equal to the sum of the zkDAI notes they own.

## How they work under the hood

Each method executes the flow as outlined below:

-   **Proof construction**: a zero-knowledge `joinSplit` proof is constructed using notes that the user owns
-   **Transaction sending**: the SDK connects to the Ethereum blockchain and the transaction, with the proof included, via the gas station network. This means that the user does not need gas to interact with Aztec
-   **Proof verification**: `ace.validateProof()` is called. This results in ACE forwading the proof onto the `JoinSplitValidator.sol` in order to have the proof validated
-   **Implementation of relevant logic**: `ZkAsset.confidentialTransferFrom()` is called upon successful validation of the proof. This results in the `inputNotes` to the `joinSplit` being destroyed and the `outputNotes` being created in the zkDAI note registry. In this way, value has been confidentially transferred.
