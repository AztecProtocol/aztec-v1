import {
    argsError,
} from '~/utils/error';
import {
    isDestroyed,
} from '~/utils/noteStatus';
import Web3Service from '~/helpers/Web3Service';
import GraphQLService from '~/background/services/GraphQLService';
import notesQuery from '~/background/services/GraphQLService/Queries/notesQuery';
import ensureInputNotes from './ensureInputNotes';

export default async function validateNoteHashes(noteHashes, {
    assetAddress,
    amount,
    numberOfInputNotes,
}) {
    if (!noteHashes.length) return null;

    const {
        data: {
            notes: {
                notes,
                error: fetchNotesError,
            },
        },
    } = await GraphQLService.query({
        query: notesQuery(`
            noteHash
            owner {
                address
            }
            value
            status
        `),
        variables: {
            where: {
                noteHash_in: noteHashes,
            },
        },
    }) || {};

    if (fetchNotesError) {
        return {
            error: fetchNotesError,
        };
    }

    let ownerError;
    let statusError;
    const {
        account: {
            address: currentAddress,
        },
    } = Web3Service;
    notes.find(({
        noteHash,
        owner,
        status,
    }) => {
        if (owner.address !== currentAddress) {
            ownerError = argsError('transaction.noteHash.owner', {
                owner,
            });
        }
        if (isDestroyed(status)) {
            statusError = argsError('transaction.noteHash.destroyed', {
                noteHash,
            });
        }
        return ownerError || statusError;
    });
    if (ownerError) {
        return ownerError;
    }
    if (statusError) {
        return statusError;
    }

    const notesAmount = notes.reduce((sum, n) => sum + n.value, 0);
    if (notesAmount < amount) {
        if (numberOfInputNotes
            && numberOfInputNotes <= noteHashes.length
        ) {
            return argsError('transaction.noteHash.amount', {
                amount,
            });
        }

        const extraAmount = amount - notesAmount;
        const sdkPickError = await ensureInputNotes({
            assetAddress,
            numberOfInputNotes: numberOfInputNotes > 0
                ? numberOfInputNotes - noteHashes.length
                : null,
            amount: extraAmount,
        });
        if (sdkPickError) {
            return sdkPickError;
        }
    }

    return null;
}
