import {
    fromViewingKey,
} from '~/utils/note';
import ConnectionService from '~/client/services/ConnectionService';
import provePrivateRange from '~/client/apis/privateRange/prove';

const dataProperties = [
    'noteHash',
    'value',
    'owner',
    'status',
];

export default class ZkNote {
    constructor({
        id,
    } = {}) {
        this.id = id;
    }

    isValid() {
        return !!this.noteHash && this.value !== null;
    }

    async init() {
        if (this.isValid()) return;

        let note;
        try {
            note = await ConnectionService.query(
                'note',
                { id: this.id },
            );
        } catch (error) {
            // developers can use this.isValid() to check if a note exists
            if (error.key !== 'note.not.found') {
                throw error;
            }
        }

        if (note) {
            dataProperties.forEach((key) => {
                this[key] = note[key];
            });
        }
    }

    /**
     *
     * @function note.export
     * @description note.export Description: Export an aztec.js note instance for use in proofs
     * @returns {Class} Note Exported note class
     */
    async export() {
        if (!this.isValid()) {
            return null;
        }

        const {
            note,
        } = await ConnectionService.query(
            'noteWithViewingKey',
            { id: this.id },
        ) || {};

        if (!note || !note.decryptedViewingKey) {
            return null;
        }

        const {
            decryptedViewingKey,
            owner = {},
        } = note;

        return fromViewingKey(decryptedViewingKey, owner.address);
    }

    /**
     * @function note.grantAccess
     * @description note.grantAccess Description: Grant note view access to an array of Ethereum addresses
     * 
     * @param {Array} addresses Array of Ethereum addresses that are to be granted note view access
     *
     * @returns {Bool} successStatus Boolean describing whether the granting of view access was successfull
     */
    async grantAccess(addresses) {
        const addressList = typeof addresses === 'string'
            ? [addresses]
            : addresses;

        const {
            success,
        } = await ConnectionService.query(
            'grantNoteAccess',
            {
                id: this.id,
                addresses: addressList,
            },
        ) || {};

        return success || false;
    }

    /**
     * @function note.equal
     * @description note.equal Description: Construct a proof that the note is equal to a particular value
     * 
     * @param {Object} note AZTEC note that is being compared
     * @param {Object} options Optional parameters to be passed:
     * 
     * - (Address) sender: The proof sender. Will use current address if empty
     * 
     * - (Object) utilityNote: Helper note used to construct the proof. Value of this note is the value that the note
     * should be equal to
     *
     * @returns {Class} PrivateRangeProof Class with the constructed proof
     */
    async equal(note, {
        sender = '',
        utilityNote = null,
    } = {}) {
        const originalNote = await this.export();
        return provePrivateRange({
            type: 'eq',
            originalNote,
            comparisonNote: note,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * @function note.greaterThan
     * @description note.greaterThan Description: Construct a proof that the note is greater than a particular value
     * 
     * @param {Object} note AZTEC note that is being compared
     * @param {Object} options Optional parameters to be passed:
     * 
     * - (Address) sender: The proof sender. Will use current address if empty
     * 
     * - (Object) utilityNote: Helper note used to construct the proof. Value of this note is the value that you are proving
     * the input note is greater than
     *
     * @returns {Class} PrivateRangeProof Class with the constructed proof
     */
    async greaterThan(note, {
        sender = '',
        utilityNote = null,
    } = {}) {
        const originalNote = await this.export();
        return provePrivateRange({
            originalNote,
            comparisonNote: note,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * @function note.lessThan
     * @description note.lessThan Description: Construct a proof that the note value is less than a particular value
     * 
     * @param {Object} note AZTEC note that is being compared
     * @param {Object} options Optional parameters to be passed:
     * 
     * - (Address) sender: The proof sender. Will use current address if empty
     * 
     * - (Object) utilityNote: Helper note used to construct the proof. Value of this note is the value that you are proving
     * the input note is less than
     *
     * @returns {Class} PrivateRangeProof Class with the constructed proof
     */
    async lessThan(note, {
        sender = '',
        utilityNote = null,
    } = {}) {
        const comparisonNote = await this.export();
        return provePrivateRange({
            originalNote: note,
            comparisonNote,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * @function note.greaterThanOrEqualTo
     * @description note.greaterThanOrEqualTo Description: Construct a proof that the note value is greater than or 
     * equal to a particular value
     * 
     * @param {Object} note AZTEC note that is being compared
     * @param {Object} options Optional parameters to be passed:
     * 
     * - (Address) sender: The proof sender. Will use current address if empty
     * 
     * - (Object) utilityNote: Helper note used to construct the proof. Value of this note is the value that you are proving
     * the input note is greater than or equal to
     *
     * @returns {Class} PrivateRangeProof Class with the constructed proof
     */
    async greaterThanOrEqualTo(note, {
        sender = '',
        utilityNote = null,
    } = {}) {
        const originalNote = await this.export();
        return provePrivateRange({
            type: 'gte',
            originalNote,
            comparisonNote: note,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * @function note.lessThanOrEqualTo
     * @description note.lessThanOrEqualTo Description: Construct a proof that the note value is less than or 
     * equal to a particular value
     * 
     * @param {Object} note AZTEC note that is being compared
     * @param {Object} options Optional parameters to be passed:
     * 
     * - (Address) sender: The proof sender. Will use current address if empty
     * 
     * - (Object) utilityNote: Helper note used to construct the proof. Value of this note is the value that you are proving
     * the input note is less than or equal to
     *
     * @returns {Class} PrivateRangeProof Class with the constructed proof
     */
    async lessThanOrEqualTo(note, {
        sender = '',
        utilityNote = null,
    } = {}) {
        const comparisonNote = await this.export();
        return provePrivateRange({
            type: 'gte',
            originalNote: note,
            comparisonNote,
            utilityNote,
            sender,
        });
    }
}
