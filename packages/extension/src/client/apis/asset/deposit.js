import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import {
    addAccess,
} from '~utils/metadata';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import asyncForEach from '~utils/asyncForEach';
import query from '~client/utils/query';
import Web3Service from '../../services/Web3Service';
import ContractError from '../../utils/ContractError';

export default async function deposit({
    assetAddress,
    amount,
    from,
    sender,
    numberOfOutputNotes,
}) {
    const {
        user,
    } = await query(`
        user(id: "${sender || ''}") {
            account {
                address
                linkedPublicKey
                spendingPublicKey
            }
            error {
                type
                key
                message
                response
            }
        }
    `);

    const {
        account,
    } = user || {};

    if (!account) {
        return null;
    }

    const {
        address: owner,
        linkedPublicKey,
        spendingPublicKey,
    } = account;

    const noteValues = Array.isArray(amount)
        ? amount
        : randomSumArray(amount, numberOfOutputNotes);
    const notes = await createNotes(
        noteValues,
        spendingPublicKey,
        owner,
    );
    const {
        JoinSplitProof,
        ProofUtils,
    } = aztec;
    const publicValue = ProofUtils.getPublicValue(
        [],
        noteValues,
    );
    const inputNotes = [];
    const depositInputOwnerAccounts = [];
    const publicOwner = from || owner;
    const depositProof = new JoinSplitProof(
        inputNotes,
        notes,
        owner,
        publicValue,
        publicOwner,
    );

    const sum = typeof amount === 'number'
        ? amount
        : noteValues.reduce((accum, v) => accum + v, 0);

    // TODO
    // this step should be done somewhere else
    try {
        await Web3Service
            .useContract('ACE')
            .method('publicApprove')
            .send(
                assetAddress,
                depositProof.hash,
                sum,
            );
    } catch (error) {
        throw new ContractError('ace.publicApprove', {
            asset: assetAddress,
            amount: sum,
            error,
        });
    }

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
