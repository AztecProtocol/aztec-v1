## Examples
### Confidentially send value of 30units to another Ethereum address
```js
// Get the injected address [change to use a different address]
const addressToDeposit = window.ethereum.selectedAddress;
const addressToSend = window.ethereum.selectedAddress;

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// // Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);
console.info(asset)

// // Deposit funds into the ZkAsset
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: addressToDeposit,
      amount: depositAmount,
    },
  ],
  {},
);

// Send funds
const sendAmount = 30;
await asset.send([
  {
    to: addressToSend,
    amount: sendAmount,
  },
], {})
console.info('sent funds confidentially');
```
