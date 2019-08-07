import provePrivateRange from './privateRange/prove';
import sendPrivateRange from './privateRange/send';
import makeProofFactory from './utils/makeProofFactory';

const privateRange = data => ({
    send: async () => sendPrivateRange(data),
    export: () => data.proof,
});

const proveMapping = {
    privateRange: provePrivateRange,
};

const proofResultMapping = {
    privateRange,
};

export default makeProofFactory(proveMapping, proofResultMapping);
