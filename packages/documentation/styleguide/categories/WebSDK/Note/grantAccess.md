## Examples
### 1) Grant note view access to a third party
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();

const noteHash = notes[0].noteHash;
const noteToGrantAccess = await window.aztec.zkNote(noteHash);
console.info({ noteToGrantAccess })

// Select the addresses to grant access
const addressToGrantAccess = [
  window.ethereum.selectedAddress, // [change to grant access to different addresses]
];

const grantSuccess = await noteToGrantAccess.grantAccess(addressToGrantAccess);
console.info({ grantSuccess });
```
