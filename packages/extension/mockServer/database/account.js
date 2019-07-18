import {
    numberOfAccount,
    enitityAddress,
    USER_PUBLIC_KEY_LENGTH,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import fetchFromData from '../utils/fetchFromData';
import generateRandomId from '../utils/generateRandomId';

const accounts = [];
for (let i = 0; i < numberOfAccount; i += 1) {
    const address = enitityAddress('account', i);
    accounts.push({
        id: address,
        address,
        publicKey: generateRandomId(USER_PUBLIC_KEY_LENGTH),
    });
}

const getFetchConditions = makeGetFetchConditions([
    'id',
    'address',
]);

export const getAccount = (_, args) => {
    const conditions = getFetchConditions(args);
    return findEntityByKey(accounts, conditions);
};

export const getAccountById = accountId => getAccount(null, { id: accountId });

const accountsWherePrefixes = [
    'id',
    'address',
];

export const getAccounts = (_, args) => fetchFromData(
    accountsWherePrefixes,
    accounts,
    args,
);

export default accounts;
