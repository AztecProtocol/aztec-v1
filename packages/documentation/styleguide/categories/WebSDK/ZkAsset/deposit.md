## Examples
### Convert 50 ERC20 tokens into zero-knowledge notes, owned by the user. 
Place your Ethereum address in the `user` variable
```js
// Get the injected address
const userAddress = '';

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);
console.info( asset );

const userPreDepositBalance = await asset.balance();
console.info({ userPreDepositBalance });

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

const userPostDepositBalance = userPreDepositBalance + depositAmount;
console.info({ userPostDepositBalance });
```

### Give a third party zero-knowledge notes worth 50 ERC20 tokens

```js
// Get the injected address
const thirdPartyAddress = '';

// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);
console.info( asset );


const preDepositBalance = await asset.balance();
console.info({ preDepositBalance });

// Deposit funds into the ZkAsset
const depositAmount = 50;
await asset.deposit(
  [
    {
      to: thirdPartyAddress,
      amount: depositAmount,
    },
  ],
  {},
);

const postDepositBalance = preDepositBalance + depositAmount;
console.info({ postDepositBalance });
```
