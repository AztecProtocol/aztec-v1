import aztec from 'aztec.js';
import {
    randomSumArray,
} from '~utils/random';
import {
    createNotes,
} from '~utils/note';
import settings from '~background/utils/settings';
import ApiError from '~/helpers/ApiError';
import {
    getExtensionAccount,
} from '~ui/apis/account';

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

export default async function deposit({
    transactions,
    publicOwner,
    sender,
    numberOfOutputNotes,
}) {
    const numberOfNotes = numberOfOutputNotes > 0
        ? numberOfOutputNotes
        : await settings('NUMBER_OF_OUTPUT_NOTES');

    const outputTransactionNotes = await Promise.all(
        transactions.map(async ({
            amount,
            to,
            numberOfOutputNotes: txNumberOfOutputNotes,
        }) => {
            const noteValues = randomSumArray(
                amount,
                txNumberOfOutputNotes || numberOfNotes,
            );
            const {
                linkedPublicKey,
                spendingPublicKey,
            } = await getExtensionAccount(to) || {};
            if (!linkedPublicKey) {
                throw new ApiError('account.not.linked', {
                    address: to,
                });
            }

            const notes = await createNotes(
                noteValues,
                spendingPublicKey,
                to,
                linkedPublicKey,
            );
            return {
                notes,
                noteValues,
            };
        }),
    );

    const {
        notes: outputNotes,
        values: outputNoteValues,
    } = outputTransactionNotes.reduce(
        ({ notes, values }, obj) => ({
            notes: notes.concat(obj.notes),
            values: values.concat(obj.noteValues),
        }), { notes: [], values: [] },
    );

    const publicValue = ProofUtils.getPublicValue(
        [],
        outputNoteValues,
    );
    const inputNotes = [];
    const proof = new JoinSplitProof(
        inputNotes,
        outputNotes,
        sender,
        publicValue,
        publicOwner,
    );

    return {
        proof,
        signatures: '0x',
        inputNotes,
        outputNotes,
    };
}
