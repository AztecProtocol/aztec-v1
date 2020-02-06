## Notes are UTXOs representing encrypted value
An AZTEC note is the fundamental encrypted representation of value in the AZTEC ecosystem. They are a UTXO, which when provided as an input to a transaction results in it being spent and when created as an output, it is created and written into storage on chain.

The SDK abstracts away the complexities of using notes for standard functionality, such as: _send()_, _deposit()_ or _withdraw()_. 

However if as a developer you wish to work with more advanced AZTEC zero-knowledge proofs such as the dividend or privateRange proofs, then you will need to work directly with notes as described in the protocol specification: `https://github.com/AztecProtocol/specification `.

&nbsp
&nbsp
&nbsp

## Note object properties
Notes returned by the SDK have four properties on them:
- noteHash: the hash of the note, a unique identifier
- value: the value which the note represents
- owner: the Ethereum address that owns the note. Ownership is defined as having both the private key and viewing key to the note
- status: status defining whether the note is spent or unspent. If unspent (and therefore available for spending) it will return 'CREATED', if spent (and therefore unavailable for spending) 'DESTROYED'.

These properties are demonstrated in the below demo code:
```js
// Enable the SDK
const apiKey = '071MZEA-WFWMGX4-JJ2C5C1-AVY458F';
await window.aztec.enable({ apiKey });

// Fetch the zkAsset
const address = '0x70c23EEC80A6387464Af55bD7Ee6C8dA273C4fb4';
const asset = await window.aztec.zkAsset(address);

// Fetch your notes
const allNotes = await asset.fetchNotesFromBalance();

const noteHash = allNotes[0].noteHash;
const note = await window.aztec.zkNote(noteHash);
console.info({ note });
```

Notes exposed by the SDK have the following methods:
- note.export()
- note.equal()
- note.greaterThan()
- note.greaterThanOrEqual()
- note.lessThan()
- note.lessThanOrEqual()

