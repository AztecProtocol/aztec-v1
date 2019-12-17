import aztec from 'aztec.js';
import {
    createNote,
    fromViewingKey,
    valueOf,
} from '~/utils/note';
import asyncMap from '~/utils/asyncMap';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ContractError from '~/client/utils/ContractError';
import ApiError from '~/client/utils/ApiError';
// import validateExtensionAccount from '../utils/validateExtensionAccount';
import toAztecNote from '../utils/toAztecNote';

const {
    BurnProof,
} = aztec;

export default async function proveBurn({
    assetAddress,
    notes,
    // sender,
}) {
    const notesOwner = {};

    let confidentialTotalBurned;
    try {
        ({
            confidentialTotalBurned,
        } = await Web3Service
            .useContract('ACE')
            .method('getRegistry')
            .call(assetAddress));
    } catch (error) {
        throw new ContractError('ace.getRegistry', {
            messageOptions: {
                asset: assetAddress,
            },
            error,
        });
    }

    let balance;
    let oldBurnedCounterNote;

    const zeroNote = await aztec.note.createZeroValueNote();
    if (confidentialTotalBurned === zeroNote.noteHash) {
        balance = 0;
        oldBurnedCounterNote = zeroNote;
    } else {
        const {
            utilityNote,
        } = await ConnectionService.query(`
            utilityNote(id: "${confidentialTotalBurned}") {
                note {
                    decryptedViewingKey
                }
                error {
                    type
                    key
                    message
                    response
                }
            }
        `) || {};

        const {
            note,
        } = utilityNote || {};
        if (!note) {
            throw new ApiError('api.burn.totalBurned.not.found');
        }

        const {
            decryptedViewingKey,
        } = note;
        if (!decryptedViewingKey) {
            throw new ApiError('api.burn.totalBurned.not.valid');
        }

        oldBurnedCounterNote = await fromViewingKey(decryptedViewingKey);
        balance = valueOf(oldBurnedCounterNote);
    }

    const {
        address: ownerAddress,
        spendingPublicKey,
        linkedPublicKey,
    } = notesOwner;

    const aztecNotes = await asyncMap(notes, async note => toAztecNote(note));
    const amount = aztecNotes.reduce((accum, n) => accum + valueOf(n), 0);
    const newBurnedCounterNote = await createNote(
        balance + amount,
        spendingPublicKey,
        ownerAddress,
        linkedPublicKey,
    );

    const proof = new BurnProof(
        oldBurnedCounterNote,
        newBurnedCounterNote,
        aztecNotes,
        ownerAddress,
    );

    return {
        proof,
        notesOwner,
        inputNotes: aztecNotes,
    };
}
