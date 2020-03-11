## Notes are UTXOs representing encrypted value

An AZTEC note is the fundamental encrypted representation of value in the AZTEC ecosystem. They are a UTXO, which when provided as an input to a transaction results in it being spent and when created as an output, it is created and written into storage on chain.

The SDK abstracts away the complexities of using notes for standard functionality, such as: _send()_, _deposit()_ or _withdraw()_.

However if as a developer you wish to work with more advanced AZTEC zero-knowledge proofs such as the dividend or privateRange proofs, then you will need to work directly with notes as described in the protocol specification: `https://github.com/AztecProtocol/specification `.

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
const zkAssetAddress = '';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Fetch a note
const [note] = await asset.fetchNotesFromBalance({ numberOfNotes: 1 });

const noteHash = note.noteHash;
const zkNote = await window.aztec.zkNote(noteHash);
console.info({ zkNote });
```

&nbsp
&nbsp

### The `ZkNote` exposed by the SDK has the following data and methods:

- _valid_ (Boolean)
- _visible_ (Boolean)
- _destroyed_ (Boolean)
- _noteHash_ (NoteHash)
- _value_ (Integer)
- _viewingKey_ (String)
- _owner_ (Object)
- [`async export()`](/#/SDK/zkNote/.export)
- [`async grantAccess()`](/#/SDK/zkNote/.grantAccess)
- [`async equal()`](/#/SDK/zkNote/.equal)
- [`async greaterThan()`](/#/SDK/zkNote/.greaterThan)
- [`async greaterThanOrEqualTo()`](/#/SDK/zkNote/.greaterThanOrEqualTo)
- [`async lessThan()`](/#/SDK/zkNote/.lessThan)
- [`async lessThanOrEqualTo()`](/#/SDK/zkNote/.lessThanOrEqualTo)
