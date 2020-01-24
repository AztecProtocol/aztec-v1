Get the value of a note, which the user has access to

__Arguments__
_None_

__Returns__
- {Number} Integer representing the unencrypted value of the note

## Examples
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();
console.info({ notes });

// Get the value of the first note
const value = notes[0].value;
console.info({ value });
```
