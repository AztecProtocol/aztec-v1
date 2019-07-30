import depositSend from './deposit/send';
import withdrawSend from './withdraw/send';
import yieldNotes from './utils/yieldNotes';

const deposit = data => ({
    send: async () => yieldNotes(depositSend, data),
    export: () => data.proof,
});

const withdraw = data => ({
    send: async () => yieldNotes(withdrawSend, data),
    export: () => data.proof,
});

const createNoteFromBalance = data => ({
    export: () => data.proof,
});

const proofMapping = {
    deposit,
    withdraw,
    createNoteFromBalance,
};

export default async function proofFactory(type, cb, options) {
    const {
        proof,
        ...data
    } = await cb(options);

    if (!proof) {
        return null;
    }

    return proofMapping[type]({
        proof,
        options,
        data,
    });
}
