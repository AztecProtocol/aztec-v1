## Examples

### Convert 50 ERC20 tokens into zero-knowledge notes, owned by the user.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Get the current user's address
const userAddress = window.aztec.account.address;

const balanceBeforeDeposit = await asset.balance();
console.info({ balanceBeforeDeposit });

// Deposit funds into the ZkAsset
const depositAmount = 50;
const response = await asset.deposit([
    {
        to: userAddress,
        amount: depositAmount,
    },
]);
console.info(response);

const balanceAfterDeposit = await asset.balance();
console.info({ balanceAfterDeposit });
```

### Give a third party zero-knowledge notes worth 50 ERC20 tokens.

```js
const thirdPartyAddress = '';

const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const balanceBeforeDeposit = await asset.balance();
console.info({ balanceBeforeDeposit });

// Deposit funds into the ZkAsset
const depositAmount = 50;
const response = await asset.deposit([
    {
        to: thirdPartyAddress,
        amount: depositAmount,
    },
]);
console.info(response);

const balanceAfterDeposit = await asset.balance();
console.info({ balanceAfterDeposit });
```
