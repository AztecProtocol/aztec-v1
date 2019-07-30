import aztec from 'aztec.js';
import asyncForEach from '~utils/asyncForEach';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

export default async function approveWithdraw({
    options: {
        assetAddress,
    },
    data: {
        inputNotes,
        inputNotesOwner,
    },
}) {
    const privateKey = '0xb8a23114e720d45005b608f8741639464a341c32c61920bf341b5cbddae7651d';
    try {
        await asyncForEach(inputNotes, async ({
            noteHash,
        }) => {
            const signature = aztec.signer.signNote(
                assetAddress,
                noteHash,
                inputNotesOwner.address,
                privateKey,
            );
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('confidentialApprove')
                .send(
                    noteHash,
                    inputNotesOwner.address,
                    true,
                    signature,
                );
        });
    } catch (error) {
        throw new ContractError('zkAsset.confidentialApprove', {
            error,
        });
    }

    return true;
}
