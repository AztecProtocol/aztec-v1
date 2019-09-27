import aztec from 'aztec.js';
import {
    createNote,
    createNotes,
    fromViewingKey,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import address from '~utils/address';
import asyncMap from '~utils/asyncMap';
import asyncForEach from '~utils/asyncForEach';
import ApiError from '~client/utils/ApiError';
import validateExtensionAccount from './utils/validateExtensionAccount';
import validateAccounts from './utils/validateAccounts';
import PickNotesQuery from '../../queries/PickNotesQuery';
import apollo from '../../../background/services/GraphQLService';

export default async function proveCreateNoteFromBalance({
    assetAddress,
    amount,
    sender,
    owner, // will be ignore if transaction is not empty
    transactions,
    publicOwner,
    // userAccess,
    numberOfInputNotes = 1,
    numberOfOutputNotes = 1,
    domain,
    currentAddress,
}) {
    const inputNotesOwner = await validateExtensionAccount({
        accountAddress: sender,
        domain,
        currentAddress,
    });
    console.log('____inputNotesOwner', inputNotesOwner);
    let inputAmount = amount;

    const outputNotesOwnerMapping = {};
    let outputNotesOwner = inputNotesOwner;
    if (transactions) {
        const userAddresses = transactions.map(t => t.to);
        const notesOwners = await validateAccounts({
            accountAddress: userAddresses,
            domain,
            currentAddress,
        });
        console.log(notesOwners);
        notesOwners.forEach((o) => {
            outputNotesOwnerMapping[o.address] = o;
        });

        inputAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        if (amount && inputAmount !== amount) {
            throw new ApiError('input.amount.not.match.transaction');
        }
    } else if (owner) {
        if (address(owner) !== inputNotesOwner.address) {
            outputNotesOwner = await validateAccounts({

                accountAddress: owner,
                domain,
                currentAddress,
            });
        }
        outputNotesOwnerMapping[outputNotesOwner.address] = outputNotesOwner;
    }
    console.log(transactions);

    console.log('______________');

    const {
        data: {
            pickNotesFromBalance,
        },
    } = await apollo.query({
        query: PickNotesQuery,
        variables: {
            assetId: assetAddress,
            amount: inputAmount,
            owner: inputNotesOwner.address,
            numberOfNotes: numberOfInputNotes,
            domain,
            currentAddress,
        },
    });
    console.log(pickNotesFromBalance);

    const {
        notes,
    } = pickNotesFromBalance || {};

    if (!notes) {
        throw new ApiError('note.pick.empty');
    }

    let inputNotes;

    try {
        inputNotes = await asyncMap(
            notes,
            async ({ decryptedViewingKey }) => fromViewingKey(
                decryptedViewingKey,
                inputNotesOwner.address,
            ),
        );
    } catch (error) {
        throw new ApiError('note.fromViewingKey', {
            notes,
        });
    }

    const outputValues = [];
    const outputNotes = [];

    const inputValues = notes.map(({ value }) => value);
    const sum = notes.reduce((accum, { value }) => accum + value, 0);
    const extraAmount = sum - inputAmount;
    if (extraAmount > 0) {
        const remainderNote = await createNote(
            extraAmount,
            inputNotesOwner.spendingPublicKey,
            inputNotesOwner.address,
            inputNotesOwner.linkedPublicKey,
        );
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
        outputNotesOwnerMapping[inputNotesOwner.address] = inputNotesOwner;
    }

    if (transactions) {
        await asyncForEach(transactions, async ({
            amount: transactionAmount,
            to,
            numberOfOutputNotes: count,
        }) => {
            const notesOwner = outputNotesOwnerMapping[address(to)];
            const values = randomSumArray(
                transactionAmount,
                count || numberOfOutputNotes,
            );
            outputValues.push(...values);
            const newNotes = await createNotes(
                values,
                inputNotesOwner.spendingPublicKey,
                notesOwner.address,
                notesOwner.linkedPublicKey,
            );
            outputNotes.push(...newNotes);
        });
    } else if (numberOfOutputNotes > 0) {
        const values = randomSumArray(
            inputAmount,
            numberOfOutputNotes,
        );
        outputValues.push(...values);

        const newNotes = await createNotes(
            values,
            inputNotesOwner.spendingPublicKey,
            outputNotesOwner.address,
            outputNotesOwner.linkedPublicKey,
        );
        outputNotes.push(...newNotes);
    }

    const {
        JoinSplitProof,
        ProofUtils,
    } = aztec;
    const publicValue = ProofUtils.getPublicValue(
        inputValues,
        outputValues,
    );
    const proof = new JoinSplitProof(
        inputNotes,
        outputNotes,
        inputNotesOwner.address,
        publicValue,
        publicOwner || inputNotesOwner.address,
    );

    console.log(proof);

    return {
        proof,
        inputNotes,
        inputNotesOwner,
        outputNotes,
        outputNotesOwner,
        outputNotesOwnerMapping,
    };
}
