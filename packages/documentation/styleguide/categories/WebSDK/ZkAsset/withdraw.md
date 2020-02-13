## Examples
### Withdraw 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by user
Place your Ethereum address in the `user` variable
```js
// Get the injected address
const userAddress = window.ethereum.selectedAddress;

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);
console.info(asset);

// Deposit funds into the ZkAsset
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: userAddress,
      amount: depositAmount,
    },
  ],
  {},
);

// Withdraw funds, to a different address
const withdrawAmount = 10;
await asset.withdraw(withdrawAmount);
```

### Withdraw 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by a third party
```js
// Get the injected address
const userAddress = window.ethereum.selectedAddress;
const thirdPartyAddress = window.ethereum.selectedAddress;

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);

// Deposit funds into the ZkAsset
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: userAddress,
      amount: depositAmount,
    },
  ],
  {},
);

// Withdraw funds
const withdrawAmount = 10;
await asset.withdraw(withdrawAmount);
console.info('withdrew funds');

```
