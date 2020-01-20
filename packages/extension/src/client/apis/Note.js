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

export default class Note {
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

    // @dev
    // exports an aztec.js note instance for use in proofs

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
     *
     * grantAccess
     *
     * - addresses ([address]!)
     *
     * @returns (Bool!)
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
     *
     * Equal
     *
     * - note (Note!|aztec.Note!)
     * - options (Object)
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
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
     * GreaterThan
     *
     * - note (Note! or aztec.Note!)
     * - options (Object)
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
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
     * LessThan
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
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
     * GreaterThanOrEqualTo
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
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
     * LessThanOrEqualTo
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
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
