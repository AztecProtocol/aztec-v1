import aztec from 'aztec.js';
import {
    createNote,
    createNotes,
    fromViewingKey,
    valueOf,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';
import ApiError from '~client/utils/ApiError';
import query from '~client/utils/query';
import validateExtensionAccount from '../utils/validateExtensionAccount';

const {
    MintProof,
} = aztec;

export default async function proveMint({
    assetAddress,
    amount,
    numberOfOutputNotes,
    sender,
}) {
    const notesOwner = await validateExtensionAccount(sender);

    let confidentialTotalMinted;
    try {
        ({
            confidentialTotalMinted,
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
    let oldMintCounterNote;

    const zeroNote = await aztec.note.createZeroValueNote();
    if (confidentialTotalMinted === zeroNote.noteHash) {
        balance = 0;
        oldMintCounterNote = zeroNote;
    } else {
        const {
            utilityNote,
        } = await query(`
            utilityNote(id: "${confidentialTotalMinted}") {
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
            throw new ApiError('api.mint.totalMinted.not.found');
        }

        const {
            decryptedViewingKey,
        } = note;
        if (!decryptedViewingKey) {
            throw new ApiError('api.mint.totalMinted.not.valid');
        }

        oldMintCounterNote = await fromViewingKey(decryptedViewingKey);
        balance = valueOf(oldMintCounterNote);
    }

    const {
        address: ownerAddress,
        linkedPublicKey,
        spendingPublicKey,
    } = notesOwner;

    const newMintCounterNote = await createNote(
        balance + amount,
        spendingPublicKey,
        ownerAddress,
        linkedPublicKey,
    );

    const noteValues = Array.isArray(amount)
        ? amount
        : randomSumArray(amount, numberOfOutputNotes);

    const mintedNotes = await createNotes(
        noteValues,
        spendingPublicKey,
        ownerAddress,
        linkedPublicKey,
    );

    const proof = new MintProof(
        oldMintCounterNote,
        newMintCounterNote,
        mintedNotes,
        notesOwner.address,
    );

    return {
        proof,
        notesOwner,
        outputNotes: mintedNotes,
    };
}
