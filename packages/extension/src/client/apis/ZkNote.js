import {
    fromViewingKey,
} from '~/utils/note';
import ConnectionService from '~/client/services/ConnectionService';
import provePrivateRange from '~/client/apis/privateRange/prove';

const dataProperties = [
    'noteHash',
    'value',
    'viewingKey',
    'owner',
    'asset',
    'status',
];

export default class ZkNote {
    constructor({
        id,
        ...note
    } = {}) {
        dataProperties.forEach((key) => {
            this[key] = note[key];
        });
        this.id = id;
    }

    get valid() {
        return typeof this.value === 'number';
    }

    get visible() {
        return !!this.viewingKey;
    }

    get destroyed() {
        return this.status === 'DESTROYED';
    }

    // @dev
    // exports an aztec.js note instance for use in proofs

    async export() {
        if (!this.visible) {
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
        if (!this.visible
            || this.destroyed
        ) {
            return false;
        }

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
     * - comparisonNote (Note!|aztec.Note!)
     * - options (Object)
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
     */
    async equal(comparisonNote, {
        sender = '',
        utilityNote = null,
    } = {}) {
        if (!this.visible) {
            return false;
        }

        const originalNote = await this.export();
        return provePrivateRange({
            type: 'eq',
            originalNote,
            comparisonNote,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * GreaterThan
     *
     * - comparisonNote (Note! or aztec.Note!)
     * - options (Object)
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
     */
    async greaterThan(comparisonNote, {
        sender = '',
        utilityNote = null,
    } = {}) {
        if (!this.visible) {
            return false;
        }

        const originalNote = await this.export();
        return provePrivateRange({
            originalNote,
            comparisonNote,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * LessThan
     *
     * - comparisonNote (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
     */
    async lessThan(comparisonNote, {
        sender = '',
        utilityNote = null,
    } = {}) {
        if (!this.visible) {
            return false;
        }

        const originalNote = await this.export();
        return provePrivateRange({
            originalNote: comparisonNote,
            comparisonNote: originalNote,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * GreaterThanOrEqualTo
     *
     * - comparisonNote (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
     */
    async greaterThanOrEqualTo(comparisonNote, {
        sender = '',
        utilityNote = null,
    } = {}) {
        if (!this.visible) {
            return false;
        }

        const originalNote = await this.export();
        return provePrivateRange({
            type: 'gte',
            originalNote,
            comparisonNote,
            utilityNote,
            sender,
        });
    }

    /**
     *
     * LessThanOrEqualTo
     *
     * - comparisonNote (Note! or aztec.Note!)
     * - options
     *       sender (Address):                  The proof sender.
     *                                          Will use current address if empty
     *       utilityNote (Note|aztec.Note)
     *
     * @returns (PrivateRangeProof)
     */
    async lessThanOrEqualTo(comparisonNote, {
        sender = '',
        utilityNote = null,
    } = {}) {
        if (!this.visible) {
            return false;
        }

        const originalNote = await this.export();
        return provePrivateRange({
            type: 'gte',
            originalNote: comparisonNote,
            comparisonNote: originalNote,
            utilityNote,
            sender,
        });
    }
}
