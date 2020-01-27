import JoinSplitFluidProof from '../../../joinSplitFluid';
import ProofType from '../../../../base/types';

class BurnProof66305 extends JoinSplitFluidProof {
    /**
     * Construct a burn proof. A burn proof artificially destroys AZTEC notes, without a transfer of public ERC20 tokens.
     * It keeps track of the total number of AZTEC notes burned using the variables `currentTotalValueNote`
     * and `newTotalValueNote`, notes whose value represents the number burned.
     *
     * The balancing relationship being satisfied is:
     *
     * currentTotalValue = newTotalValue + mintedNotesValue
     *
     * @param {Object} currentTotalValueNote - note whose value represents the total current value of burned notes
     * @param {Object} newTotalValueNote - note whose value represents the new total value ofburned notes
     * @param {Object[]} burnedNotes - notes to be minted or burned
     * @param {string} sender - Ethereum address of the transaction sender
     */
    constructor(currentTotalValueNote, newTotalValueNote, burnedNotes, sender) {
        super(ProofType.BURN.name, currentTotalValueNote, newTotalValueNote, burnedNotes, sender);
    }
}

export default BurnProof66305;
