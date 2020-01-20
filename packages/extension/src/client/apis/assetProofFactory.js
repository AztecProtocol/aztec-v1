import proveMint from './mint/prove';
import sendMint from './mint/send';
import proveBurn from './burn/prove';
import sendBurn from './burn/send';
import proveSwap from './swap/prove';
import approveSwap from './swap/approve';
import sendSwap from './swap/send';
import yieldNotes from './utils/yieldNotes';
import makeProofFactory from './utils/makeProofFactory';

const mint = data => ({
    send: async () => yieldNotes(sendMint, data),
    export: () => data.proof,
});

const burn = data => ({
    send: async () => yieldNotes(sendBurn, data),
    export: () => data.proof,
});

const swap = data => ({
    approve: async () => approveSwap(data),
    send: async () => yieldNotes(sendSwap, data),
    export: () => data.proof,
});

const proveMapping = {
    mint: proveMint,
    burn: proveBurn,
    swap: proveSwap,
};

const proofResultMapping = {
    mint,
    burn,
    swap,
};

const proofFactory = makeProofFactory(proveMapping, proofResultMapping);

export default proofFactory;
