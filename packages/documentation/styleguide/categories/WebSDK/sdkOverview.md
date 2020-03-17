The AZTEC SDK allows developers to use AZTEC's zero-knowledge proofs in order to transact confidentially over public Ethereum. It exposes a core API, giving users the ability to deposit, send, and withdraw funds confidentially. This API is accompanied by a UI component which appears at the relevant point, guiding the user through the API action.

&nbsp
&nbsp
&nbsp

## Documentation details

### Demo code examples

Each API method is documented by showing a live demo of the method code. There is a in-page interactive JavaScript console associated with the docs for each method, which contains example code showing how the API can be used in your dapp. The consoles have a `Run` button which, when clicked, will cause the code to be executed and trigger any resulting action - such as the SDK UI popping up.

In addition, as each console is interactive, users are able to freely edit the code and write any arbitrary JavaScript - allowing you to play around and experiment. Logs are returned at key stages of the API, documenting the result of your actions.

### Free Transactions

The AZTEC SDK uses the gas station network to send transactions so the end user does not have to pay for Gas. In order to use this service you will need an API key. You can request one at `https://airtable.com/shrQ1wrqAO3KZwV1h`.The AZTEC docs are designed to work on the Rinkeby network. We will be updating them to work on Ganache in Q2.

### Test Ether & Test Dai

The docs make use of a test ERC20 token Dai, which has mintable priviledges. The token is deployed to the following address `0xA166dDEC05b04E1e0De4b2268d3243018f9990B3`. Each example lets the user request Test Eth or Test Dai if they run out.

Please visit the AZTEC website for more information `(https://www.aztecprotocol.com)` and reach out to us with any questions through our Discord server!

## SDK vs aztec.js

The SDK is built as a wrapper and layer of abstraction on-top of the low level AZTEC npm package `aztec.js`. It's purpose is to abstract away many of the complexities traditionally involved in using AZTEC zero-knowledge proofs via `aztec.js`. AZTEC's UTXO model, viewing key management and explicit proof construction have all been abstracted away from dapp builders.
