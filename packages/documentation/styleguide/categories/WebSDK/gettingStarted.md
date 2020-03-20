### 1) Install the SDK in your dapp

The SDK first needs to be installed into your dapp. This is done by adding one line of JavaScript to your Dapp

```js static
<script type="module" src="https://sdk.aztecprotocol.com/aztec.js"></script>
```

Upon successfully loading, the SDK will then inject the following object into the _window_ of each page:

```js static
window.aztec = {
    enable: async function(options) {},
};
```

### 2) Enable the SDK

The SDK now needs to be enabled in order for it to be used in your dapp. This is achieved by calling the _enable()_ method, which itself takes one optional argument - _options_. _options_ is an object with three possible properties:

-   _web3Provider_ : custom provider alternative to that injected by the browser
-   _contractAddresses_: used when the SDK is interacting with contracts deployed locally on Ganache. Two addresses need manually supplying:
    -   _ace_
    -   _aztecAccountRegistry_
        Documentation support for this is being added in Q2.
-   _apiKey_ : issued in accordance with the AZTEC free transaction programme, used for free transactions mediated by the Gas Station Network (GSN)

#### An example _options_ object to use the SDK on Rinkeby will therefore look like:

```js static
const options = {
    web3Provider: window.web3.currentProvider, // change this value to use a different web3 provider
    contractAddresses: {
        ace: '0xFA8eD6F76e8f769872a1f8a89085c56909EC8Cfc', // the address of the ace contract on the local network
        aztecAccountRegistry: '0x66db0e20a9d619ee3dfa3819513ab8bed1b21a87' // the address of the aztec account registry contract on the local network.
    },
        apiKey: '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV', // API key for use with GSN for free txs.
    },
}
```

#### Calling _enable()_ will perform 3 key actions:

1. Create a keypair for the user, that is used for encrypting and decrypting AZTEC note viewing keys
2. Store the keypair in an encrypted keyvault in local storage of aztecprotocol.com, encrypted with the user's password
3. Ensure the public key of the keypair has been linked to an ethereum address on chain via the AccountRegistry contract

The function returns a promise which resolves to the full AZTEC api if all checks pass. Run the below code to see an example of the SDK being enabled, and the UI from a user's perspective:

```js
const apiKey = '';

try {
    await window.aztec.enable({ apiKey });
    console.info('SDK successfully enabled');
} catch (e) {
    console.info('Failed to enable SDK.');
}
```
