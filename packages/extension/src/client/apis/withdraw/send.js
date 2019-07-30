import aztec from 'aztec.js';
import devUtils from '@aztec/dev-utils';
import asyncForEach from '~utils/asyncForEach';
import {
    addAccess,
} from '~utils/metadata';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';

const { JOIN_SPLIT_PROOF } = devUtils.proofs;

export default async function withdraw({
    proof,
    options: {
        assetAddress,
    },
    data: {
        sender,
        inputNotes,
        outputNotes,
        linkedPublicKey,
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
                sender,
                privateKey,
            );
            await Web3Service
                .useContract('ZkAsset')
                .at(assetAddress)
                .method('confidentialApprove')
                .send(
                    noteHash,
                    sender,
                    true,
                    signature,
                );
        });
    } catch (error) {
        throw new ContractError('zkAsset.confidentialApprove', {
            error,
        });
    }

    try {
        const transferData = proof.encodeABI(assetAddress);
        await Web3Service
            .useContract('ACE')
            .method('validateProof')
            .send(
                JOIN_SPLIT_PROOF,
                sender,
                transferData,
            );
    } catch (error) {
        throw new ContractError('ace.validateProof', {
            type: 'JOIN_SPLIT',
            error,
        });
    }

    try {
        await Web3Service
            .useContract('ZkAsset')
            .at(assetAddress)
            .method('confidentialTransferFrom')
            .send(
                JOIN_SPLIT_PROOF,
                proof.eth.output,
            );
    } catch (error) {
        throw new ContractError('zkAsset.confidentialTransferFrom', {
            error,
        });
    }

    try {
        const {
            outputCoder,
        } = aztec.encoder;
        const outputNoteHashes = outputCoder.getOutputNotes(proof.output);

        await asyncForEach(outputNotes, async (note, i) => {
            const {
                noteHash,
            } = note.exportNote();
            const realViewingKey = note.getView();
            const outputNote = outputCoder.getNote(outputNoteHashes, i);
            const metadata = outputCoder.getMetadata(outputNote);
            const viewingKey = encryptedViewingKey(linkedPublicKey, realViewingKey);
            const newMetadata = addAccess(metadata, {
                address: sender,
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
    } catch (error) {
        throw new ContractError('note.shareAccess', {
            error,
        });
    }

    return outputNotes;
}
