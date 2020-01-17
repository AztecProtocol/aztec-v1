Fetch the notes stored in the `zkAsset` that are owned by the user and match the given query

__Arguments__
- {Object} __Query__: which specifies four categories along which notes can be filtered and requested:
  - numberOfNotes: number of notes which match the query to return
  - equalTo: the exact value all notes need to match
  - greaterThan: if no equalTo parameter, the minimum value of notes returned
  - lessThan: if no equalTo parameter, the maximum value of notes returned

__Returns__
- {Array} Notes matching the supplied query


&nbsp  

## Examples
### Fetch notes corresponding to a particular query
```js
// Enable the SDK
const apiKey = '7FJF5YK-WV1M90Y-G25V2MW-FG2ZMDV';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a';
const asset = await window.aztec.zkAsset(address);

const query = {
  numberOfNotes: 1,
  equalTo: 20,
  greaterThan: 10,
  lessThan: 30,
};

// Fetch notes
const notes = await asset.fetchNotesFromBalance(query);
console.info({ notes });
```

&nbsp  

### Fetch all notes
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
```

