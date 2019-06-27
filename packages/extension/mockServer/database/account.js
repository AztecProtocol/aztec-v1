import {
    numberOfAccount,
    entityId,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';

const accounts = [];
for (let i = 0; i < numberOfAccount; i += 1) {
    accounts.push({
        id: entityId('account', i),
        address: `account_address_${i}`,
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

export const getAccountById = accountId =>
    getAccount(null, { id: accountId });

export default accounts;
