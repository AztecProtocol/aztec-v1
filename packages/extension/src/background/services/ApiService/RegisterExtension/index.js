import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import query from '../utils/query';
import UserPermissionQuery from '../queries/UserPermissionQuery';

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
    } = await query(request, UserPermissionQuery) || {};

    let error;
    if (!account
        || (!account.blockNumber && !account.registeredAt)
    ) {
        ({
            data: {
                error,
                ...account
            } = {},
        } = await registerExtensionUi(request, connection));

        if (account.linkedPublicKey) {
            // call validateUserPermission again to start EventService and NoteService
            await query(request, UserPermissionQuery);
        }
    }

    return {
        account,
        error,
    };
};

export default registerExtension;
