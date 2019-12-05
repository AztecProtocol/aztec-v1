import {
    fromViewingKey,
} from '~utils/note';
import ConnectionService from '~/client/services/ConnectionService';
import proofFactory from './noteProofFactory';

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
        return !!this.noteHash;
    }

    async init() {
        if (this.isValid()) return;

        const {
            note,
        } = await ConnectionService.query(
            'note',
            { id: this.id },
        ) || {};

        if (note) {
            dataProperties.forEach((key) => {
                this[key] = note[key];
            });
        }
    }

    // @dev
    // exports an aztec.js note instance for use in proofs

    async export() {
        if (!this.isValid) {
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

        const { permission } = await ConnectionService.query(
            'grantNoteAccess',
            {
                id: this.id,
                addresses: addressList,
            },
        ) || {};
    }

    /**
     *
     * Equal
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):          The proof sender.
     *
     * @returns (Bool!)
     */
    async equal(note, {
        sender,
    } = {}) {
        const originalNote = await this.export();
        return proofFactory(
            'privateRange',
            {
                type: 'eq',
                originalNote,
                comparisonNote: note,
                sender,
            },
        );
    }

    /**
     *
     * GreaterThan
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):          The proof sender.
     *
     * @returns (Bool!)
     */
    async greaterThan(note, {
        sender,
    } = {}) {
        const originalNote = await this.export();
        return proofFactory(
            'privateRange',
            {
                originalNote,
                comparisonNote: note,
                sender,
            },
        );
    }

    /**
     *
     * LessThan
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):          The proof sender.
     *
     * @returns (Bool!)
     */
    async lessThan(note, {
        sender,
    } = {}) {
        const comparisonNote = await this.export();
        return proofFactory(
            'privateRange',
            {
                originalNote: note,
                comparisonNote,
                sender,
            },
        );
    }

    /**
     *
     * GreaterThanOrEqualTo
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):          The proof sender.
     *
     * @returns (Bool!)
     */
    async greaterThanOrEqualTo(note, {
        sender,
    } = {}) {
        const originalNote = await this.export();
        return proofFactory(
            'privateRange',
            {
                type: 'gte',
                originalNote,
                comparisonNote: note,
                sender,
            },
        );
    }

    /**
     *
     * LessThanOrEqualTo
     *
     * - note (Note! or aztec.Note!)
     * - options
     *       sender (Address):          The proof sender.
     *
     * @returns (Bool!)
     */
    async lessThanOrEqualTo(note, {
        sender,
    } = {}) {
        const comparisonNote = await this.export();
        return proofFactory(
            'privateRange',
            {
                type: 'gte',
                originalNote: note,
                comparisonNote,
                sender,
            },
        );
    }
}
