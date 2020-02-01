import {
    JoinSplitProof,
    ProofUtils,
} from 'aztec.js';
import {
    randomSumArray,
} from '~/utils/random';
import {
    createNotes,
} from '~/utils/note';
import settings from '~/background/utils/settings';
import {
    batchGetExtensionAccount,
} from '~/ui/apis/account';

export default async function deposit({
    transactions,
    publicOwner,
    sender,
    numberOfOutputNotes,
    userAccessAccounts,
}) {
    const numberOfNotes = numberOfOutputNotes > 0
        ? numberOfOutputNotes
        : await settings('NUMBER_OF_OUTPUT_NOTES');

    const addresses = transactions.map(({ to }) => to);
    const accounts = await batchGetExtensionAccount(addresses);

    const outputTransactionNotes = await Promise.all(
        transactions.map(async ({
            amount,
            to,
            numberOfOutputNotes: txNumberOfOutputNotes,
        }, i) => {
            const noteValues = randomSumArray(
                amount,
                txNumberOfOutputNotes || numberOfNotes,
            );
            const {
                linkedPublicKey,
                spendingPublicKey,
            } = accounts[i] || {};
            const ownerAccess = {
                address: to,
                linkedPublicKey,
            };
            const userAccess = !userAccessAccounts
                ? ownerAccess
                : [
                    ...userAccessAccounts,
                    ownerAccess,
                ].filter((access, idx, arr) => idx === arr.findIndex(({
                    address,
                }) => address === access.address));
            const notes = await createNotes(
                noteValues,
                spendingPublicKey,
                to,
                userAccess,
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
