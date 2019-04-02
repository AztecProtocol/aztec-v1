/**
 * AZTEC note - encrypted representation of value, making use of the efficient 
 * AZTEC commitment function
 * @typedef {Object} note 
 * @property {address} owner - owner of the note
 * @property {bytes32} noteHash - keccak256 hash of the uncompressed Note coordinates
 * @property {bytes} noteData - compressed AZTEC note data. Used when emitting events
 * @property {bytes} noteData - compressed AZTEC note data. Used when emitting events
 */

/** 
 * proofOutput - a bytes argument containing transfer instructions, outputted from a zero
 * knowledge proof
 * @typedef {Object} proofOutput 
 * @property {note[]} inputNotes - notes to be input to a zero-knowledge proof
 * @property {note[]} outputNotes - notes outputted from a zero-knowledge proof
 * @property {address} publicOwner - Ethereum address of the public value owner
 * @property {Number} publicValue - quantity of public value being input to a zero-knowledge proof
 */

/**
 * proofOutputs - bytes argument containing multiple proofOutput objects
 * @typedef {Object[]} proofOutputs 
 * @property {proofOutput[]} proofOutput - array of proofOutput objects
 */ 
