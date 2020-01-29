## Examples
### 1) Grant note view access to a third party
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
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
