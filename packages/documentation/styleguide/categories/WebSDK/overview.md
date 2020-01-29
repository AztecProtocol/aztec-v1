## The role of the SDK

The AZTEC SDK allows developers to use AZTEC's zero-knowledge proofs in order to transact confidentially over public Ethereum. It exposes a core API,giving users the ability to deposit, send, and withdraw funds confidentially. This API is accompanied by a UI component which pops up at the relevant moment, guiding the user through the API action.

Each API method is documented by showing a live demo of the method code. There is a in-page interactive JavaScript console associated with the docs for each method, which contains example code showing how the API can be used in your dapp. The consoles have a `Run` button which, when clicked, will cause the code to be executed and trigger any resulting action - such as the SDK UI popping up.

In addition, as each console is interactive, users are able to freely edit the code and write any arbitrary JavaScript - allowing you to play around and experiment. Logs are returned at key stages of the API, documenting the result of your actions. 

&nbsp  


### SDK vs aztec.js
The SDK is built as a wrapper and layer of abstraction ontop of the the low level AZTEC npm package `aztec.js`. It's purpose is to abstract away many of the complexities traditionally involved in using AZTEC zero-knowledge proofs via `aztec.js`. AZTEC's UTXO model in the form of notes, viewing key management and explicit proof construction have all been abstracted away from dapp builders.

<!-- AZTEC itself is based on a UTXO model, where each UTXO - referred to as a note - represents an encrypted value. A user's balance is equal to the sum of the encrypted values of the notes they own, with each note being decryptable by a __viewing key__. This has all been abstracted away, such that the user does not need to interact with notes, it handles all viewing key management and automatically deals with the  proof construction; allowing developers to focus on building dapps ontop of AZTEC. -->

&nbsp 
&nbsp 






