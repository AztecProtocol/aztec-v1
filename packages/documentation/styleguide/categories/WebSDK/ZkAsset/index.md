`ZkAssets` can be thought of as a confidential version of an ERC20 contract. Once the SDK is enabled, you can then interact directly with any `ZkAsset`, by specifiying the address of the deployed asset and calling the `window.aztec.zkAsset()` method as below:

```js
// Enable the SDK
const apiKey = '';
const result = await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

console.info(asset);
```

&nbsp
&nbsp

### The `zkAsset` has the following data and methods on it:

-   _valid_ (Boolean)
-   _address_ (Address)
-   _linkedTokenAddress_ (Address)
-   _scalingFactor_ (String)
-   _canAdjustSupply_ (Boolean)
-   _canConvert_ (Boolean)
-   _token_ (Object): A token object contains `address`, `name`, and `decimals`

Main APIs:

-   [`async deposit()`](/#/SDK/zkAsset/.deposit)
-   [`async send()`](/#/SDK/zkAsset/.send)
-   [`async withdraw()`](/#/SDK/zkAsset/.withdraw)

Utilities:

-   [`async balance()`](/#/SDK/zkAsset/.balance)
-   [`async transactions()`](/#/SDK/zkAsset/.transactions)
-   [`async subscribeToBalance()`](/#/SDK/zkAsset/.subscribeToBalance)
-   [`async createNotesFromBalance()`](/#/SDK/zkAsset/.createNotesFromBalance)
-   [`async fetchNotesFromBalance()`](/#/SDK/zkAsset/.fetchNotesFromBalance)
-   [`async balanceOfLinkedToken()`](/#/SDK/zkAsset/.balanceOfLinkedToken)
-   [`async allowanceOfLinkedtoken()`](/#/SDK/zkAsset/.allowanceOfLinkedtoken)
-   [`async totalSupplyOfLinkedtoken()`](/#/SDK/zkAsset/.totalSupplyOfLinkedtoken)
-   [`async toNoteValue()`](/#/SDK/zkAsset/.toNoteValue)
-   [`async toTokenValue()`](/#/SDK/zkAsset/.toTokenValue)
