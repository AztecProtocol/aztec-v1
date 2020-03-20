import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import account from './Account';
import user from './Account/user';
import users from './Account/users';
import encryptMessage from './Account/encrypt';
import decryptMessage from './Account/decrypt';
import prove from './Prove';
import asset from './Asset';
import assetBalance from './Asset/getBalance';
import fetchNotesFromBalance from './Asset/fetchNotesFromBalance';
import fetchTransactions from './Asset/fetchTransactions';
import note from './Note';
import noteWithViewingKey from './Note/exportViewingKey';
import grantNoteAccess from './Note/grantNoteAccess';
import validateParameters from './middlewares/validateParameters';
import validateRequest from './middlewares/validateRequest';

const apis = {
    registerExtension,
    registerDomain,
    account,
    user,
    users,
    encryptMessage,
    decryptMessage,
    asset,
    assetBalance,
    fetchNotesFromBalance,
    fetchTransactions,
    note,
    noteWithViewingKey,
    grantNoteAccess,
    constructProof: prove,
};

const clientApi = async (request, connection) => {
    // TODO move all auth here
    const {
        data: {
            query,
            args,
        },
    } = request;

    const invalidParamsResp = validateParameters(query, args);
    if (invalidParamsResp) {
        return {
            ...request,
            data: invalidParamsResp,
        };
    }

    const invalidRequestResp = await validateRequest(query, args);
    if (invalidRequestResp) {
        return {
            ...request,
            data: invalidRequestResp,
        };
    }

    const data = await apis[query](request, connection);

    return {
        ...request,
        data: query === 'constructProof'
            ? { data }
            : data,
    };
};

const uiApi = async (request) => {
    const {
        data: {
            query,
        },
    } = request;

    const data = await apis[query](request);

    return {
        ...request,
        response: data,
    };
};

const apiExists = query => !!apis[query];

export default {
    clientApi,
    uiApi,
    apiExists,
};
