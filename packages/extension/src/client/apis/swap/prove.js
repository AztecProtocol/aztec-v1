import aztec from 'aztec.js';
import ApiError from '~client/utils/ApiError';

export default async function proveSwap({
    swap: {
        makerBid,
        takerBid,
        takerAsk,
        makerAsk,
    },
    sender,
}) {
    const {
        SwapProof,
        ProofUtils,
        metaData,
        note,
    } = aztec;

    // const taker = await validateAccount(takerBid.owner, true);
    // const maker = await validateAccount(takerAsk.owner, true);

    const inputNotes = [makerBid, takerBid];
    const outputNotes = [makerAsk, takerAsk];

    const proof = new SwapProof(
        inputNotes,
        outputNotes,
        sender,
    );

    return {
        proof,
        notes: {
            inputNotes,
            outputNotes,
        },
        sender,
    };
}
