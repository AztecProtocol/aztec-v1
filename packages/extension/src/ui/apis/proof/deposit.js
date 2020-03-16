import {
    JoinSplitProof,
    ProofUtils,
} from 'aztec.js';
import uniqBy from 'lodash/uniqBy';
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

    const accountMapping = {};
    const addresses = transactions.map(({ to }) => to);
    const accounts = await batchGetExtensionAccount(addresses);
    accounts.forEach((account) => {
        accountMapping[account.address] = account;
    });

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
            } = accountMapping[to];
            const ownerAccess = {
                address: to,
                linkedPublicKey,
            };
            const userAccess = !userAccessAccounts.length
                ? ownerAccess
                : uniqBy(
                    [
                        ...userAccessAccounts,
                        ownerAccess,
                    ],
                    'address',
                );
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
