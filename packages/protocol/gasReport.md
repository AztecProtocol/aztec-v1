## Gas Report  

Test zkAsset.sol transfer with 2 output notes, 0 input notes

Gas Consumed: 807,041  

Calldata: 40,464 
TxBase: 21,000 
Opcodes : 745,577  

745,577
718,318

 27,259 saving
 20,000 from storage homogenisation
 7,259 from gas gibgabs

### Summary  

Crypto cost: 558,321
Storage cost: 95,000  (reduced to 75,000)
External calls cost: 62,469    
Event cost: 8,125  

Combined 'hard' costs = 723,915

Smart contract 'logic' costs = 21,662

### Notes  

* Code is performing a lot of redundant `sload` calls to the same variable!  
* `validators` and `disabledValidators` are VERY expensive to read from (~300 gas after sload costs). Triple mappings are a bit blah, it seems.  
* When we write output notes, we're performing 2 unnecessary `sstore` opcodes per note! Need to see how to remove this  
* We should probably hardcode the common reference string into our validators. TBH changing the CRS should mean migrating to new proof IDs to begin with, and it will save ~1,200 gas per call
* (investigate if we can reduce event costs - they seem very high)  
* (post audit): we should probably make a 'validateAndUpdate' helper function in ACE for situations where msg.sender is the prover and note updater. Would save ~10,000 gas by not setting/resetting `validatedProofs`


### Breakdown of Opcode cost

## JoinSplit.sol  

Validator: 556,512  
ABIEncoder: 1,602
Total costs: 558,321

## ACE

### ACE.updateOutputNotes  

Updating registry.notes (1st note): 30,000  
Updating registry.notes (2nd note): 30,000  
Sload ops: 1,000  
Remaining: 2,117

Writing storage variables seems to invoke an `sload` opcode, even when there is no need.  
Each storage variable is 1 word but the compiler is still using 3 `sstore` opcodes per note instead of 1.  
Something is a bit odd here - this function shouldn't be chewing through so much gas.

### ACE.getValidatorAddress  

Sload ops: 600  
Remaining: 1073
Total: 1673  

Using 1 too many `sload` here. Also, these 3-deep nested mappings are consuming a VERY large amount of gas (investigate).  

### ACE.updateNoteRegistry  

External ERC20 call: 62,469  
Updating totalSupply: 20,000
Updating publicApprovals: 5,000  
Updating validatedProofs: 5,000  
Sload ops: 1,600
Remaining: 1,694  

We're checking registry.flags 4 times - can rewrite to incur only 1 sload.  
Similarly, registry.publicApprovals is being loaded 3 times - can refactor like ^^  

(why does it cost 100 gas to compute a storage pointer?)

### ACE.validateProofByHash  

Sload ops: 400  
Remaining: 742  

Again, we're paying a heavy price for these nested mappings. Also, `keccak256(abi.encode(_proofHash, _proof, _proofSender))` costs 200 gas, but the raw opcode cost should be closer to 50.  

### ACE.validateProof  

Sload ops: 1,400  
Updating validatedProofs: 20,000  
Remaining: 1,505  

Hardcoding the CRS (in the validator contracts - swapping CRS = swapping validators) would save 1,200 here. Rest seems fairly optimized already.

### ProofUtils.getProofComponents  

Total: 570  

We use this function a lot. Even though it's optimized assembly, the overheads of calling the function add up.  
(also we can use bit shifts instead of div opcodes)  

### NoteUtils  

NoteUtils.getLength = 259  
NoteUtils.get = 624  
NoteUtils.extractProofOutput = 242  
NoteUtils.extractNote = 344  

These are all fairly optimized, perhaps we can make finer-grained methods that return specific variables (instead of 'extractNote', 'extractProofOutput') that might help a bit.  

### SafeMath  

SafeMath.sub: 225  
SafeMath.add: 1875 (yikes!)
