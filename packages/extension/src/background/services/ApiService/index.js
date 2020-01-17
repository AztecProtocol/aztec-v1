import registerExtension from './RegisterExtension';
import registerDomain from './RegisterDomain';
import account from './Account';
import prove from './Prove';
import asset from './Asset';
import assetBalance from './Asset/getBalance';
import fetchNotesFromBalance from './Asset/fetchNotesFromBalance';
import * as note from './Note';
import noteWithViewingKey from './Note/exportViewingKey';
import grantNoteAccess from './Note/grantNoteAccess';
import validateParameters from './middlewares/validateParameters';
import validateRequest from './middlewares/validateRequest';

const apis = {
    registerExtension,
    registerDomain,
    account,
    asset,
    assetBalance,
    fetchNotesFromBalance,
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
        data,
    };
};

export default {
    clientApi,
};
