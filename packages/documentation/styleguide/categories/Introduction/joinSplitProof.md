
The basic mechanism whereby notes can be transferred, and so value confidentially sent, is via a  `JoinSplit` proof. This is the basic AZTEC building block that allows value to be sent confidentially. 

In a `JoinSplit` proof particular notes are provided as inputs, and certain notes provided as outputs. The input notes are the input value that is being transferred, these will be destroyed and removed from the system upon successfull proof verification. The output notes will be created and ownership of them is granted to the desired Ethereum address. 


## Example: using a joinSplit proof to confidentially transfer value
Consider the below example as to how value can be transferred using a JoinSplit proof: 

&nbsp
<img src="../../images/joinSplitImage.png" width="75%">
&nbsp

Alice wishes to confidentially transfer Bob 75 zkDAI. She starts off with 2 notes whose value sum to 100 zkDAI, whilst Bob starts off with no notes and no zkDAI.

To transfer, Alice constructs a `joinSplit` proof where she supplies her 60 and 40 zkDAI notes as inputs. She creates two output notes, one worth 75 zkDAI for Bob and one worth 25 zkDAI for herself. It is important to note that a joinSplit proof will only be successfully validated if the total inputs equal the total output - this is crucial to prevent double spending. 

Once the proof has been validated on chain, the `inputNotes` will be destroyed and the `outputNotes` created. In this way, Alice has transferred Bob 75 zkDAI. 


In the protocol, notes are stored on chain in an asset's note registry with a user's balance being equal to the sum of user's notes. 
 