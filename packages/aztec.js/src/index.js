const encoder = require('./encoder');
const keccak = require('./keccak');
const note = require('./note');
const proof = require('./proof');
const setup = require('./setup');
const signer = require('./signer');

module.exports = epoch => {
    // take the given epoch (if given) and pass as an argument to the proof module

    // set the default epoch
    
    
    return {
        encoder,
        keccak,
        note,
        ...proof,
        setup,
        signer,
    }
};
