## Examples
### 1) Grant note view access to a third party
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x00408e1Ae7F5E590FAed44aE2cee5a9C23CA683d';
const asset = await window.aztec.zkAsset(address);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();

const noteHash = notes[0].noteHash;
const noteToGrantAccess = await window.aztec.zkNote(noteHash);
console.info({ noteToGrantAccess })

// Select the addresses to grant access - [change to grant different addresses access]
const addressToGrantAccess = [
  '',
];

const grantSuccess = await noteToGrantAccess.grantAccess(addressToGrantAccess);
console.info({ grantSuccess });
```
