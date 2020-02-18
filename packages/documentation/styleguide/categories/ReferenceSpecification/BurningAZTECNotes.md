Burning is enacted in an identical fashion to note minting. The total amount of burned AZTEC notes is tracked by a `bytes32 confidentialTotalBurned` variable.  

Burn proofs follow a similar pattern - updating the `totalBurned` variable and destroying the specified AZTEC notes.  

It should be stressed that only a note registry owner, who has set the relevant permissions on their note registry, can call `ACE.mint` and `ACE.burn`.  

If ERC20 tokens have been converted into AZTEC notes, which are subsequently burned, the resulting tokens will be permanently locked inside `ACE` and will be unretrievable. Care should be taken by a note registry owner that this behaviour is desired when they burn notes.
