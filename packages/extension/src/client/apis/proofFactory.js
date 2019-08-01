import approveDeposit from './deposit/approve';
import sendDeposit from './deposit/send';
import approveCreateNoteFromBalance from './createNoteFromBalance/approve';
import sendCreateNoteFromBalance from './createNoteFromBalance/send';
import sendMint from './mint/send';
import yieldNotes from './utils/yieldNotes';

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

const send = data => ({
    approve: async () => approveCreateNoteFromBalance(data),
    send: async () => yieldNotes(sendCreateNoteFromBalance, data),
    export: () => data.proof,
});

const createNoteFromBalance = data => ({
    approve: async () => approveCreateNoteFromBalance(data),
    send: async () => yieldNotes(sendCreateNoteFromBalance, data),
    export: () => data.proof,
});

const proofMapping = {
    deposit,
    withdraw,
    send,
    mint,
    createNoteFromBalance,
};

export default async function proofFactory(type, cb, options) {
    const {
        proof,
        ...data
    } = await cb(options) || {};

    if (!proof) {
        return null;
    }

    return proofMapping[type]({
        proof,
        options,
        data,
    });
}
