import proveDeposit from './deposit/prove';
import approveDeposit from './deposit/approve';
import proveWithdraw from './withdraw/prove';
import proveSend from './send/prove';
import sendDeposit from './deposit/send';
import proveCreateNoteFromBalance from './createNoteFromBalance/prove';
import approveCreateNoteFromBalance from './createNoteFromBalance/approve';
import sendCreateNoteFromBalance from './createNoteFromBalance/send';
import proveMint from './mint/prove';
import sendMint from './mint/send';
import proveBurn from './burn/prove';
import sendBurn from './burn/send';
import proveSwap from './swap/prove';
import approveSwap from './swap/approve';
import sendSwap from './swap/send';
import provePrivateRange from './privateRange/prove';
import yieldNotes from './utils/yieldNotes';
import makeProofFactory from './utils/makeProofFactory';

const deposit = data => ({
    approve: async () => approveDeposit(data),
    send: async () => yieldNotes(sendDeposit, data),
    export: () => data.proof,
});

const withdraw = data => ({
    approve: async () => approveCreateNoteFromBalance(data),
    send: async () => yieldNotes(sendCreateNoteFromBalance, data),
    export: () => data.proof,
});

const mint = data => ({
    send: async () => yieldNotes(sendMint, data),
    export: () => data.proof,
});

const burn = data => ({
    send: async () => yieldNotes(sendBurn, data),
    export: () => data.proof,
});

const send = data => ({
    approve: async () => approveCreateNoteFromBalance(data),
    send: async () => yieldNotes(sendCreateNoteFromBalance, data),
    export: () => data.proof,
});

const swap = data => ({
    approve: async () => approveSwap(data),
    send: async () => yieldNotes(sendSwap, data),
    export: () => data.proof,
});

const createNoteFromBalance = data => ({
    approve: async () => approveCreateNoteFromBalance(data),
    send: async () => yieldNotes(sendCreateNoteFromBalance, data),
    export: () => data.proof,
});

const privateRange = data => ({
    export: () => data.proof,
});

const proveMapping = {
    deposit: proveDeposit,
    withdraw: proveWithdraw,
    send: proveSend,
    mint: proveMint,
    burn: proveBurn,
    createNoteFromBalance: proveCreateNoteFromBalance,
    privateRange: provePrivateRange,
    swap: proveSwap,
};

const proofResultMapping = {
    deposit,
    withdraw,
    send,
    mint,
    burn,
    createNoteFromBalance,
    privateRange,
    swap,
};

const proofFactory = makeProofFactory(proveMapping, proofResultMapping);

export default proofFactory;
