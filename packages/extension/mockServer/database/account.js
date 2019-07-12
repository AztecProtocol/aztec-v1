import {
    numberOfAccount,
    enitityAddress,
    publicKeyLength,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
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

export default accounts;
