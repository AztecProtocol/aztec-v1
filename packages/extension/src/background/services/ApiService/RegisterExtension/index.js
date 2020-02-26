import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';
import userPermissionQuery from '~/background/services/GraphQLService/Queries/userPermissionQuery';
import query from '../utils/query';

const registerExtensionUi = async (request, connection) => {
    const {
        requestId,
    } = request;

    connection.UiActionSubject.next({
        ...request,
        type: 'ui.register.extension',
    });

    return filterStream(
        uiReturnEvent,
        requestId,
        connection.MessageSubject.asObservable(),
    );
};

const registerExtension = async (request, connection) => {
    let {
        userPermission: { account = {} },
    } = await query(request, userPermissionQuery(`
        address
        linkedPublicKey
        spendingPublicKey
        blockNumber
    `)) || {};

    let error;
    if (!account || !account.blockNumber) {
        ({
            data: {
                error,
                ...account
            } = {},
        } = await registerExtensionUi(request, connection));

        if (!error && account.linkedPublicKey) {
            // query again to start EventService and NoteService
            await query(request, userPermissionQuery(`
                linkedPublicKey
                blockNumber
            `));
        }
    }

    const {
        address,
        linkedPublicKey,
        spendingPublicKey,
    } = account || {};

    return {
        account: !address
            ? null
            : {
                address,
                linkedPublicKey,
                spendingPublicKey,
            },
        error,
    };
};

export default registerExtension;
