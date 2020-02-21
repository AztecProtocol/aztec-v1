import { toWei } from 'web3-utils';
import { privateToAddress } from 'ethereumjs-util';

import getNetwork from './getNetwork';

import ganacheConfig from '../../config/ganache';

const defaultNumberOfAccounts = 10;
const network = getNetwork();

export default function generateAccounts() {
    const accounts = [];
    const {
        numberOfAccounts = defaultNumberOfAccounts,
        defaultBalanceEther = 0,
    } = (ganacheConfig.networks || {})[network] || {};

    for (let i = 0; i < numberOfAccounts; i += 1) {
        let address;
        const privateKey = process.env[`GANACHE_TESTING_ACCOUNT_${i}`];
        if (privateKey) {
            address = privateToAddress(privateKey);
            const balance = toWei(
                `${process.env[`GANACHE_TESTING_ACCOUNT_${i}_BALANCE`] || defaultBalanceEther}`,
                'ether',
            );
            accounts.push({
                address,
                privateKey,
                balance,
            });
        }
    }
    return accounts
        .reduce((acc, { privateKey, balance }) => {
            acc.push(`--account=${privateKey},${balance}`);
            return acc;
        }, []);
};