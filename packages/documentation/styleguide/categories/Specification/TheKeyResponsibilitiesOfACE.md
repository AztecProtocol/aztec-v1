The `ACE` engine has two critical responsibilities:

1. Determine the correctness of valid AZTEC zero-knowledge proofs and permanently record the existence of validated `BALANCED` proofs
2. Update the state of its note registries when presented with valid transfer instructions

When processing a transfer instruction, the following criteria must be met:

-   Did the transfer instruction originate from the note registry's owner?
-   Is the transfer instruction sourced from a _mathematically legitimate_ AZTEC proof?

Because of these dual responsibilities, valid AZTEC proofs are _not_ catalogued against specific note registries. The outputs of any valid proof can, theoretically, be issued to any note ,registry. After all, the existence of a valid proof indicates the resulting transfer instructions are balanced. This is the critical property that `ACE` _must_ ensure, that all of its note registries are balanced and that there is no double spending.

Restricting note registry updates to the creator of a given note registry provides a natural separation of concerns - `ACE` determines whether a transfer instruction _can_ happen and the note registry owner determines whether the instruction _should_ happen.

### Separating proof validation and note registry interactions

Because of these dual responsibilities, it might seem intuitive to roll proof validation and note registry updates into a single function. However, this would undermine one of the key strengths of the AZTEC protocol - that third party dApps can validate zero-knowledge proofs and send the resulting transfer instructions to AZTEC-compatible confidential assets. [Zero-knowledge dApp contract interaction, an example flow with bilateral swaps](#zero-knowledge-dapp-contract-interaction-an-example-flow-with-Swaps) demonstrates this type of interaction and, consequently, the importance of separating proof validation from note registry updates.
