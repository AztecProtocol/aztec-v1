import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import validateUserPermission from '../utils/validateUserPermision';

const registerExtensionUi = async (query, connection) => {
    const {
        account,
        requestId,
        data: {
            args,
        },
    } = query;

    connection.UiActionSubject.next({
        type: 'ui.register.extension',
        requestId,
        data: {
            ...account,
            ...args,
        },
    });

    const response = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    );

    const {
        data: registeredData,
    } = response || {};
    if (registeredData && registeredData.linkedPublicKey) {
        // call validateUserPermission again to start EventService and NoteService
        await validateUserPermission({
            ...args,
            domain: window.location.origin,
        });
    }

    return response;
};

const registerExtension = async (query, connection) => {
    const {
        data: {
            args,
        },
    } = query;

    let {
        userPermission: { account = {} },
    } = await validateUserPermission({
        ...args,
        domain: window.location.origin,
    }) || {};

    let error;
    if (!account
        || (!account.blockNumber && !account.registeredAt)
    ) {
        const queryWithAccount = {
            ...query,
            account: account && account.address
                ? account
                : { address: args.currentAddress },
        };
        ({
            data: account,
            error,
        } = await registerExtensionUi(queryWithAccount, connection));
    }

    return {
        ...query,
        data: {
            account,
            error,
        },
    };
};

export default registerExtension;
