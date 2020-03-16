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
