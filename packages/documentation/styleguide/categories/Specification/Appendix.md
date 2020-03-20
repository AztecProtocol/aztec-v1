## A: Preventing collisions and front-running

For any AZTEC verification smart contract, the underlying zero-knowledge protocol must have a formal proof describing the protocol's completeness, soundness and honest-verifier zero-knowledge properties.

In addition to this, and faithfully implementing the logic of the protocol inside a smart contract, steps must be undertaken to prevent 'proof collision', where a `bytes proofOutput` instruction from a proof has an identical structure to a `bytes proofOutput` instruction from a different smart contract verifier. This is done by integrating the `uint24 _proof` variable associated with that specific verification smart contract into the `uint256 challenge` variable contained in each `bytes proofOutput` entry.

Secondly, the front-running of proofs must be prevented. This is the act of taking a valid zero-knowledge proof that is inside the transaction pool but not yet mined, and integrating the proof into a malicious transaction for some purpose that is different to that of the transaction sender. This is achieved by integrating the message sender into challenge variable - it will not be possible for a malicious actor to modify such a proof to create a valid proof of their own construction, unless they know the secret witnesses used in the proof.

Getting `msg.sender` into the verification contract is done by passing through this variable as an input argument from the contract that is calling `ACE.sol`. If this is not done correctly, the asset in question is susceptible to front-running. This does not expose any security risk for the protocol, as assets that correctly use ACE are not affected by assets that incorrectly implement the protocol.

## B - Interest streaming via AZTEC notes

Consider a contract that accepts a DAI note (let's call it the origination note), and issues confidential Loan notes in exchange, where the sum of the values of the loan notes is equal to the sum of the values of the origination note (this is enforced).

When a deposit of confidential DAI is supplied to the contract in the form of an interest payment (call it an interest note), a ratio is defined between the value of the interest note and the origination note.

The AZTEC Cryptography Engine supports a zero-knowledge proof that allows loan 'note' holders to stream value out of the interest note. Effectively printing zkDAI notes whose value is defined by the above ratio and the absolute value of their loan note. In exchange, the interest note is destroyed.

What is important to highlight in this exchange, is that the zk-DAI contract is not having to make any assumptions about the zk-Loan contract, or trust in the correctness of the zk-Loan contract's logic.

The zero-knowledge proofs in ACE enable the above exchange to occur with a gaurantee that there is no double spending. The above mechanism cannot be used to 'print' zk-DAI notes whose sum is greater than the interest note. `NoteRegistry` and `ACE` only validate the mathematical correctness of the transaction - whether the loan notes (and resulting interest payments) are correctly distrubted according to the semantics of the loan's protocol is not relevant to ensure that there is no double spending.
