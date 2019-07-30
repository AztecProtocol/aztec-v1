import aztec from 'aztec.js';
import {
    addAccess,
} from '~utils/metadata';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import asyncForEach from '~utils/asyncForEach';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

export default async function sendDeposit({
    proof: depositProof,
    options: {
        assetAddress,
    },
    data: {
        owner,
        notes,
        linkedPublicKey,
    },
}) {
    const depositInputOwnerAccounts = [];
    const depositData = depositProof.encodeABI(assetAddress);
    const depositSignatures = depositProof.constructSignatures(
        assetAddress,
        depositInputOwnerAccounts,
    );

    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialTransfer')
            .send(
                depositData,
                depositSignatures,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialTransfer', {
            asset: assetAddress,
            error,
            notes,
        });
    }

    const {
        outputCoder,
    } = aztec.encoder;
    await asyncForEach(notes, async (note, i) => {
        const {
            noteHash,
        } = note.exportNote();
        const realViewingKey = note.getView();
        const outputNotes = outputCoder.getOutputNotes(depositProof.output);
        const outputNote = outputCoder.getNote(outputNotes, i);
        const metadata = outputCoder.getMetadata(outputNote);
        const viewingKey = encryptedViewingKey(linkedPublicKey, realViewingKey);
        const newMetadata = addAccess(metadata, {
            address: owner,
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

    return notes;
}
