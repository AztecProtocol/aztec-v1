const { note } = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');

const userA = secp256k1.generateAccount();
const userB = secp256k1.generateAccount();

const customMetaData = {
    // eslint-disable-next-line max-len
    data:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000000000014100000000000000000000000000000000000000000000000000000000000003d70000000000000000000000000000000000000000000000000000000000000003000000000000000000000000ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a000000000000000000000000ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1a000000000000000000000000ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2a0000000000000000000000000000000000000000000000000000000000000003c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c20000000000000000000000000000000000000000000000000000000000000001dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    addresses: [
        '0xad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0ad0a',
        '0xad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1ad1a',
        '0xad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2ad2a',
    ],
};

const revisedCustomMetaData = {
    // eslint-disable-next-line max-len
    data:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa00000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000000000014100000000000000000000000000000000000000000000000000000000000003d70000000000000000000000000000000000000000000000000000000000000003000000000000000000000000ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3a000000000000000000000000ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4a000000000000000000000000ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5a0000000000000000000000000000000000000000000000000000000000000003c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c2c20000000000000000000000000000000000000000000000000000000000000001dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    addresses: [
        'ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3ad3a',
        '0xad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4ad4a',
        '0xad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5ad5a',
    ],
};

/**
 * Generate a set of notes, given the desired note values and account of the owner
 *
 * @method getNotesForAccount
 * @param {Object} aztecAccount - Ethereum account that owns the notes to be created
 * @param {Number[]} noteValues - array of note values, for which notes will be created
 * @returns {Note[]} - array of notes
 */
const getNotesForAccount = async (aztecAccount, noteValues) => {
    return Promise.all(noteValues.map((noteValue) => note.create(aztecAccount.publicKey, noteValue)));
};

/**
 * General purpose function that generates a set of notes to be used in a deposit join split proof.
 *
 * There are no inputNotes created in this function - it generates notes for a deposit proof i.e. a joinSplit
 * where tokens are being converted into notes.
 *
 * Output notes are created. The values of these output notes is determined by the input argument
 * depositOutputNoteValues
 *
 * @method getDepositNotes
 * @param {Number[]} depositOutputNoteValues - array of note values, for which notes will be created
 * @returns {Note[]} depositInputNotes - input notes for a deposit join split proof
 * @returns {Note[]} depositOutputNotes - output notes for a deposit join split proof
 * @returns {Object[]} depositInputOwnerAccounts - Ethereum accounts of the input note owners
 * @returns {Object[]} depositOutputOwnerAccounts - Ethereum accounts of the output note owners
 */
const getDepositNotes = async (depositOutputNoteValues) => {
    const depositInputNotes = [];
    const depositOutputNotes = await getNotesForAccount(userA, depositOutputNoteValues);
    const depositInputOwnerAccounts = [];
    const depositOutputOwnerAccounts = [userA];
    return {
        depositInputNotes,
        depositOutputNotes,
        depositInputOwnerAccounts,
        depositOutputOwnerAccounts,
    };
};

/**
 * Generates a default set of notes to be used in a deposit proof - a joinSplit proof that converts tokens
 * into output notes
 *
 * Default notes and values are:
 * - no input notes
 * - depositPublicValue = 10
 * - one output note, value = 10
 *
 * @method getDefaultDepositNotes
 * @returns {Object} ...notes - outputs from the getDepositNotes() function
 * @returns {Numbner} depositPublicValue - number of tokens being converted into notes
 */
const getDefaultDepositNotes = async () => {
    // There is no input note, as value is being deposited into ACE with an output
    // note being created
    const outputNoteValues = [10];
    const depositPublicValue = 10;

    const notes = await getDepositNotes(outputNoteValues);
    return {
        ...notes,
        depositPublicValue,
    };
};

/**
 * General purpose function that generates a set of notes to be used in a deposit joinSplit proof
 * followed by a transfer joinSplit proof.
 *
 * The scenario is that a deposit proof is being performed, followed by a transfer proof.
 * In the deposit proof, public tokens are being converted into notes.
 *
 * These notes are then the input to a transfer proof, where notes are transferred to a second user.
 * During this proof, some note value is also converted back into public token form and withdrawn.
 *
 * The value of the notes created and involved in the proofs is controlled through the two input arguments:
 * depositOutputNoteValues and transferOutputNoteValues
 *
 * @method getDepositAndTransferNotes
 * @param {Number[]} depositOutputNoteValues - output note values for the deposit proof
 * @param {Number[]} transferOutputNoteValues - output note values for the transfer proof
 * @returns {Note[]} depositInputNotes - inputs for a deposit join split proof
 * @returns {Note[]} depositOutputNotes - output notes for a deposit join split proof
 * @returns {Object[]} depositInputOwnerAccounts - Ethereum accounts of the deposit input note owners
 * @returns {Object[]} depositOutputOwnerAccounts - Ethereum accounts of the deposit output note owners
 * @returns {Note[]} transferInputNotes - inputs for a transfer join split proof
 * @returns {Note[]} transferOutputNotes - output notes for a transfer join split proof
 * @returns {Object[]} transferInputOwnerAccounts - Ethereum accounts of the transfer input note owners
 * @returns {Object[]} transferOutputOwnerAccounts - Ethereum accounts of the transfer output note owners
 * @returns {Note[]} notes - array of all notes created
 * @returns {ownerAccounts} ownerAccounts - Ethereum accounts of the created notes
 */
const getDepositAndTransferNotes = async (depositOutputNoteValues, transferOutputNoteValues) => {
    const depositInputNotes = [];
    const depositInputOwnerAccounts = [];
    const depositOutputNotes = await getNotesForAccount(userA, depositOutputNoteValues);
    const depositOutputOwnerAccounts = new Array(depositOutputNotes.length).fill(userA);

    const transferInputNotes = depositOutputNotes;
    const transferInputOwnerAccounts = depositOutputOwnerAccounts;
    const transferOutputNotes = await getNotesForAccount(userB, transferOutputNoteValues);
    const transferOutputOwnerAccounts = new Array(transferOutputNotes.length).fill(userB);

    const notes = [...depositOutputNotes, ...transferOutputNotes];
    const ownerAccounts = [...depositOutputOwnerAccounts, ...transferOutputOwnerAccounts];
    return {
        depositInputNotes,
        depositOutputNotes,
        depositInputOwnerAccounts,
        depositOutputOwnerAccounts,
        transferInputNotes,
        transferOutputNotes,
        transferInputOwnerAccounts,
        transferOutputOwnerAccounts,
        notes,
        ownerAccounts,
    };
};

/**
 * Generates a default set of notes to be used in a deposit proof, followed by a transfer proof.
 *
 * The deposit proof involves converting public tokens into output notes. These output notes then
 * become the input notes to a transfer proof - which generates output notes owned by a different user and
 * converts some value back into public tokens.
 *
 *
 * Default notes and values are:
 * Deposit proof:
 * - no input notes
 * - depositPublicValue = 60
 * - two output notes owned by userA with values 50 and 10
 *
 * Transfer proof:
 * - input notes are the output notes from the deposit proof (values of 50 and 10)
 * - withdrawalPublicValue = 10
 * - two output notes owned by a different user, userB, with values 20 and 30
 *
 * @method getDefaultDepositAndTransferNotes
 * @returns {Object} ...notes - outputs from the getDepositNotes() function
 * @returns {Numbner} depositPublicValue - number of tokens being converted into notes
 */
const getDefaultDepositAndTransferNotes = async () => {
    // There is no input note, as value is being deposited into ACE with an output
    // note being created
    const depositOutputNoteValues = [50, 10];
    const depositPublicValue = -60;

    // transfer proof input notes are the deposit proof output notes
    const transferOutputNoteValues = [20, 30];
    const withdrawalPublicValue = 10;

    const noteCategories = await getDepositAndTransferNotes(depositOutputNoteValues, transferOutputNoteValues);
    const notes = [...noteCategories.depositOutputNotes, ...noteCategories.transferOutputNotes];
    const ownerAccounts = [...noteCategories.depositOutputOwnerAccounts, ...noteCategories.transferOutputOwnerAccounts];
    return {
        ...noteCategories,
        depositPublicValue,
        withdrawalPublicValue,
        notes,
        ownerAccounts,
    };
};

module.exports = {
    customMetaData,
    getDepositNotes,
    getDefaultDepositNotes,
    getDepositAndTransferNotes,
    getDefaultDepositAndTransferNotes,
    getNotesForAccount,
    revisedCustomMetaData,
};
