## Getting started
The SDK first needs to be installed into your dapp. This can be done using one of three potential methods:

### 1. 

### 2.

### 3.


Upon successfully loading, the SDK will then inject the following object into the `window` of each page:

```js
window.aztec = {
  enable: async function(options) {}
}
```

The SDK now needs to be enabled in order for it to be used in your dapp. This is achieved by calling the `enable()` method, which itself takes one optional argument - `options`:

&nbsp 
&nbsp 
&nbsp 

```js
const options = {
    web3Provider: window.web3.currentProvider, // change this value to use a different web3 provider
    contractAddresses: {
        web3Provider: window.web3.currentProvider, // change this value to use a different web3 provider
        ace: '0xFA8eD6F76e8f769872a1f8a89085c56909EC8Cfc', // the address of the ace contract on the local network
        aztecAccountRegistry: '0x66db0e20a9d619ee3dfa3819513ab8bed1b21a87' // the address of the aztec account registry contract on the local network.    
    },
        apiKey: '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV', // API key for use with GSN for free txs.
    },
}
```

A custom `web3Provider` can be provided, `contractAddresses` can be passed to run the SDK with ganache deployed contracts, and an `apiKey` can be used for free transactions mediated by the gas station network (GSN).

Calling `enable()` will perform 3 key actions:

1. Create a keypair for the user, that is used for encrypting and decrypting AZTEC Nnote viewing keys.
2. Store the keypair in an encrypted keyvault in local storage of aztecprotocol.com, encrypted with the user's password.
3. Ensure the public key of the keypair has been linked to an ethereum address on chain via the AZTECAccountRegistry contract.

The function returns a promise which resolves to the full AZTEC api if all checks pass. Run the below code to see an example of the SDK being enabled, and the UI from a user's perspective:

```js
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';

// Enable the SDK
const result = await window.aztec.enable({ apiKey });
console.info('SDK successfully enabled');
```
