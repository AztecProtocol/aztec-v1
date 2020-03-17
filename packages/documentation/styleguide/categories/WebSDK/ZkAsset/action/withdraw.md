## Examples

### Withdraw 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by user.

```js
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(address);

const balanceBeforeWithdraw = await asset.balance();
console.info({ balanceBeforeWithdraw });

// Withdraw funds
const withdrawAmount = 10;
const response = await asset.withdraw(withdrawAmount);
console.info(response);

const balanceAfterWithdraw = await asset.balance();
console.info({ balanceAfterWithdraw });
```

### Withdraw 10 units of zero-knowledge notes into 10 ERC20 tokens, to be owned by a third party.

```js
const thirdPartyAddress = '';

const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

const balanceBeforeWithdraw = await asset.balance();
console.info({ balanceBeforeWithdraw });

// Withdraw funds to a different address
const withdrawAmount = 10;
const response = await asset.withdraw(withdrawAmount, {
    to: thirdPartyAddress,
});
console.info(response);

const balanceAfterWithdraw = await asset.balance();
console.info({ balanceAfterWithdraw });
```
