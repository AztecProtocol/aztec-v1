import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';
import userPermissionQuery from '~/background/services/GraphQLService/Queries/userPermissionQuery';
import AuthService from '~/background/services/AuthService';
import query from '../utils/query';

const registerExtensionUi = async (request, connection) => {
    const {
        requestId,
        domain,
        data: {
            args,
            ...rest
        },
    } = request;
    const registeredDomain = await AuthService.getRegisteredDomain(domain);

    connection.UiActionSubject.next({
        ...request,
        type: 'ui.register.extension',
        data: {
            ...rest,
            args: {
                ...args,
                domainRegistered: !!registeredDomain,
            },
        },
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
        linkedPublicKey
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

        if (account.linkedPublicKey) {
            // query again to start EventService and NoteService
            await query(request, userPermissionQuery(`
                linkedPublicKey
                blockNumber
            `));
        }
    }

    return {
        account,
        error,
    };
};

export default registerExtension;
