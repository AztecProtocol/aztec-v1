import depositApprove from './deposit/approve';
import depositSend from './deposit/send';
import withdrawApprove from './withdraw/approve';
import withdrawSend from './withdraw/send';
import mintSend from './mint/send';
import yieldNotes from './utils/yieldNotes';

const deposit = data => ({
    approve: async () => depositApprove(data),
    send: async () => yieldNotes(depositSend, data),
    export: () => data.proof,
});

const withdraw = data => ({
    approve: async () => withdrawApprove(data),
    send: async () => yieldNotes(withdrawSend, data),
    export: () => data.proof,
});

const mint = data => ({
    send: async () => yieldNotes(mintSend, data),
    export: () => data.proof,
});

const createNoteFromBalance = data => ({
    export: () => data.proof,
});

const proofMapping = {
    deposit,
    withdraw,
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
