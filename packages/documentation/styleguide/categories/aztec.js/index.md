`aztec.js` is the main Aztec low level npm package and is what the SDK relies on. It is written in JavaScript and it's principle responsibility is to construct zero-knowledge proofs. To this end, it exposes the following proof construction methods:

- JoinSplitProof()
- DividendProof()
- SwapProof()
- MintProof()
- BurnProof()
- PrivateRangeProof()
- PublicRangeProof()

### Other uses
In addition, the package has a variety of other common uses, including:
- `note` creation
- EIP712 signature generation for approving and spending notes
- proof encoding and decoding utilities

## Documentation
The package methods are extensively documented using JSDoc. These docs are available here: https://aztecprotocol.github.io/AZTEC/ . 
