## Examples
### Confidentially send value of 30units to another Ethereum address
```js
// Get the injected address
const addressToDeposit = window.ethereum.selectedAddress;
const addressToSend = window.ethereum.selectedAddress;

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// // Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);
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
