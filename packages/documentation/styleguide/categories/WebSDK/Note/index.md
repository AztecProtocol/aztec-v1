An AZTEC note is the fundamental encrypted representation of value in the AZTEC ecosystem. They are a UTXO which when provided as an input to a transaction is spent, and when created as an output it is written into storage on chain.

The SDK abstracts away the complexities of using notes for standard functionality, such as: _send()_, _deposit()_ or _withdraw()_. 

However if as a developer you wish to work with more advanced AZTEC zero-knowledge proofs such as the dividend or privateRange proofs, then you will need to work directly with notes as described in the protocol specification: `https://github.com/AztecProtocol/specification `.

&nbsp
&nbsp
&nbsp

Notes exposed by the SDK have the following methods:
- note.equal()
- note.greaterThan()
- note.greaterThanOrEqual()
- note.lessThan()
- note.lessThanOrEqual()
- note.

