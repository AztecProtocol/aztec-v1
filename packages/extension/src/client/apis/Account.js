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
