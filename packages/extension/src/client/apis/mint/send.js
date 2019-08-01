import aztec from 'aztec.js';
import devUtils from '@aztec/dev-utils';
import asyncForEach from '~utils/asyncForEach';
import {
    addAccess,
} from '~utils/metadata';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

const {
    outputCoder,
} = aztec.encoder;
const { MINT_PROOF } = devUtils.proofs;

export default async function sendMint({
    proof,
    options: {
        assetAddress,
    },
    data: {
        notesOwner: {
            address: notesOwnerAddress,
            linkedPublicKey,
        },
        outputNotes,
    },
}) {
    try {
        const proofData = proof.encodeABI();

        await Web3Service
            .useContract('ZkAssetMintable')
            .at(assetAddress)
            .method('confidentialMint')
            .send(
                MINT_PROOF,
                proofData,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialMint', {
            error,
        });
    }

    await asyncForEach(outputNotes, async (note) => {
        const {
            noteHash,
        } = note.exportNote();
        const realViewingKey = note.getView();
        const outputNote = outputCoder.encodeOutputNote(note);
        const metadata = outputCoder.getMetadata(outputNote);
        const viewingKey = encryptedViewingKey(linkedPublicKey, realViewingKey);
        const newMetadata = addAccess(metadata, {
            address: notesOwnerAddress,
            viewingKey: viewingKey.toHexString(),
        });

        try {
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('updateNoteMetaData')
                .send(
                    noteHash,
                    newMetadata,
                );
        } catch (error) {
            throw new ContractError('zkAsset.updateNoteMetaData', {
                note,
            });
        }
    });

    return outputNotes;
}
