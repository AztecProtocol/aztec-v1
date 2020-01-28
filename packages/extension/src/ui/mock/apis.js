/* eslint-disable no-alert */
import {
    randomInt,
} from '~/utils/random';
import sleep from '~/utils/sleep';
import realApis from '~/ui/apis';
import {
    addresses,
    assets,
} from './data';

const mock = async (data) => {
    await sleep(randomInt(2000));
    const fakeData = {
        ...data,
        mock: true,
        timestamp: Date.now(),
    };
    return fakeData;
};

const mockSigningApi = (message) => {
    const signed = window.confirm(message);
    let error = null;
    if (!signed) {
        error = {
            message: 'User denied transaction.',
        };
    }
    return {
        success: !error,
        error,
    };
};

const mergeApis = (defaultApis, customApis = {}) => {
    const mockApis = {};
    Object.keys(defaultApis).forEach((name) => {
        if (typeof defaultApis[name] === 'object') {
            mockApis[name] = mergeApis(defaultApis[name], customApis[name]);
        } else {
            mockApis[name] = customApis[name] || mock;
        }
    });

    return mockApis;
};

export default mergeApis(realApis, {
    auth: {
        getCurrentUser: () => ({
            address: addresses[0],
        }),
        linkAccountToMetaMask: () => mockSigningApi('Link accounts?'),
    },
    account: {
        getExtensionAccount: address => ({
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
        }),
        batchGetExtensionAccount: addressArr => addressArr.map((address => ({
            address,
            linkedPublicKey: 'linked_public_key',
            spendingPublicKey: 'spending_public_key',
        }))),
    },
    asset: {
        getAssets: async () => assets,
        getDomainAssets: async () => assets,
        approveERC20Allowance: ({
            requestedAllowance,
        }) => {
            const {
                error,
            } = mockSigningApi('Approve ERC20 Allowance?');
            return {
                requestedAllowance: !error ? requestedAllowance : 0,
                error,
            };
        },
        confidentialTransfer: () => mockSigningApi('Run confidentialTransfer?'),
    },
    note: {
        fetchNote: noteHash => ({
            noteHash,
            value: randomInt(10000),
            asset: assets[0],
        }),
        signProof: () => mockSigningApi('Sign notes?'),
    },
});
