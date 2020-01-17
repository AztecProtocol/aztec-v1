Grant note view access to a third party. Calling this method will update the metaData of the note and broadcast it on chain in the form of a event `UpdateNoteMetaData(noteOwner, noteHash, metaData)`

__Arguments__
- {String} __address__: Ethereum address which is to be given view access to the note

__Returns__
- {String} Ethereum address which owns the note


```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

// Fetch notes
const notes = await asset.fetchNotesFromBalance();

// Get the value of the first note
// const addressToGiveAccess = ''; // pass in some form of address here
// await notes[0].grantNoteAccess(addressToGiveAccess);


// ideally want to sure the fired event here
```
