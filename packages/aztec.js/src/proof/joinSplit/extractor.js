/**
 * Extractor algorithm for AZTEC join-split zero-knowledge proofs. Used to validate the soundness of our sigma protocol
 *
 * @namespace extractor
 * @memberof module:proof.joinSplit
 */

const proofUtils = require('../proofUtils');

const extractor = {};

/**
 * Extract the witnesses for two proof transcripts over the same input string but with different challenges.  
 * We use this to validate the soundness of our implementation in the random oracle model.
 *
 * @method extractWitness
 * @memberof module:proof.joinSplit.extractor
 * @param {Object[]} transcripts size-2 array of AZTEC proof data
 * @param {number} m number of input notes
 * @param {string[]} challenges size-2 array of hex-string formated proof challenges
 * @returns {Object[]} the AZTEC notes used in the proof, with their extracted witnesses (the note value and note viewing key)
 */
extractor.extractWitness = (transcripts, m, challenges) => {
    const {
        notes: firstNotes,
        challenge: firstChallenge,
        rollingHash,
    } = proofUtils.convertTranscript(transcripts[0], m, challenges[0], [], 'joinSplit');

    const {
        notes: secondNotes,
        challenge: secondChallenge,
    } = proofUtils.convertTranscript(transcripts[1], m, challenges[1], [], 'joinSplit');
    rollingHash.keccak();
    const challengeFactor = firstChallenge.redSub(secondChallenge).redInvm();
    const witnesses = firstNotes.map((firstNote, i) => {
        const secondNote = secondNotes[i];
        const k = firstNote.kBar.redSub(secondNote.kBar).redMul(challengeFactor);
        const a = firstNote.aBar.redSub(secondNote.aBar).redMul(challengeFactor);
        return {
            gamma: firstNote.gamma,
            sigma: firstNote.sigma,
            k,
            a,
        };
    });
    return witnesses;
};

module.exports = extractor;
