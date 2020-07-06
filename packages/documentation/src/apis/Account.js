import {
    note as noteUtils,
} from 'aztec.js';
import uniq from 'lodash/uniq';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiError from '~/client/utils/ApiError';

const dataProperties = [
    'address',
    'linkedPublicKey',
    'spendingPublicKey',
];

class Account {
    constructor(account) {
        dataProperties.forEach((key) => {
            this[key] = account[key] || '';
        });
        this.id = account.address;
    }

    get registered() {
        return !!this.linkedPublicKey;
    }

    /**
     *
     * @function user.createNote
     * @description Description: Create an AZTEC note owned by the user.
     *
     * @param {Integer} value Value of the note.
     *
     * @param {[Address]} userAccess Optional array of address that will be granted view access to the note value.
     *
     * @returns {AztecNote} note An AZTEC note owned by the user.
     *
     */
    async createNote(value, userAccess = []) {
        if (!this.registered) {
            throw new ApiError('user.unregistered', {
                fn: 'createNote',
            });
        }

        let noteAccess = [];
        if (userAccess && userAccess.length) {
            ({
                accounts: noteAccess,
            } = await ConnectionService.query(
                'users',
                {
                    where: {
                        address_in: uniq(userAccess),
                    },
                },
                `
                    address
                    linkedPublicKey
                `,
            ) || {});
        }

        return noteUtils.create(
            this.spendingPublicKey,
            value,
            noteAccess,
            this.address,
        );
    }

    /**
     *
     * @function user.encryptMessage
     * @description Description: Encrypt a message using the user's public key.
     *
     * @param {String} message Message to be encrypted.
     *
     * @returns {HexString} encrypted An encrypted message.
     *
     */
    async encryptMessage(message) {
        if (!this.registered) {
            throw new ApiError('user.unregistered', {
                fn: 'encryptMessage',
            });
        }

        const { encrypted } = await ConnectionService.query(
            'encryptMessage',
            {
                address: this.address,
                linkedPublicKey: this.linkedPublicKey,
                message,
            },
        ) || {};

        return encrypted;
    }

    /**
     *
     * @function user.decryptMessage
     * @description Description: Decrypt a message using the user's private key.
     * This method is available only for current user.
     *
     * @param {HexString} encrypted An encrypted message.
     *
     * @returns {String} message The decrypted message.
     *
     */
    async decryptMessage(message) {
        if (this.address !== Web3Service.account.address) {
            throw new ApiError('user.logout', {
                fn: 'decryptMessage',
            });
        }

        const { decrypted } = await ConnectionService.query(
            'decryptMessage',
            {
                address: this.address,
                message,
            },
        ) || {};

        return decrypted;
    }
}

export default Account;
