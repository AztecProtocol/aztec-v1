const { Enum } = require('enumify');

class ProofType extends Enum {}
const types = ['BURN', 'DIVIDEND', 'JOIN_SPLIT', 'MINT', 'PRIVATE_RANGE', 'PUBLIC_RANGE', 'SWAP'];
ProofType.initEnum(types);

module.exports = ProofType;
