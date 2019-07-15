import {
    numberOfAccount,
    enitityAddress,
    publicKeyLength,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import filterByWhere from '../utils/filterByWhere';
import generateRandomId from '../utils/generateRandomId';

const accounts = [];
for (let i = 0; i < numberOfAccount; i += 1) {
    const address = enitityAddress('account', i);
    accounts.push({
        id: address,
        address,
        publicKey: generateRandomId(publicKeyLength),
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

export const getAccounts = (_, args) => {
    const {
        first,
        where,
    } = args;

    const filteredAccounts = filterByWhere(
        where,
        accountsWherePrefixes,
        accounts,
    );

    return filteredAccounts.slice(0, first);
};

export default accounts;
