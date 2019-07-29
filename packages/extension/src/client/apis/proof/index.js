import deposit from './deposit';
import yieldNotes from '../utils/yieldNotes';

const depositProof = data => ({
    send: async () => yieldNotes(deposit, data),
    export: () => data.proof,
});

const proofMapping = {
    deposit: depositProof,
};

export default function proofFactory(type, data) {
    return proofMapping[type](data);
}
