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

    if (account && !account.registeredAt) {
        connection.UiActionSubject.next({
            type: 'ui.register.extension',
            requestId,
            data: {
                response: {
                    ...account,
                    ...args,
                },
                requestId,
            },
        });

        const response = await filterStream(
            uiReturnEvent,
            query.requestId,
            connection.MessageSubject.asObservable(),
        );
        const {
            data: registeredData,
        } = response.data || {};
        if (registeredData && registeredData.linkedPublicKey) {
            // call validateUserPermission again to start EventService and NoteService
            await validateUserPermission({
                ...args,
                domain: window.location.origin,
            });
        }

        return {
            ...query,
            response: {
                account: response,
            },
        };
    }
    return query;
};

const registerExtension = async (query, connection) => {
    const {
        data: { args },
    } = query;

    const {
        userPermission: { account = {} },
    } = await validateUserPermission({
        ...args,
        domain: window.location.origin,
    }) || {};

    if (account && account.blockNumber) {
        return {
            ...query,
            response: {
                account,
                error: null,
            },
        };
    }

    const queryWithAccount = {
        ...query,
        account: account && account.address ? account : { address: query.data.args.currentAddress },
    };

    return registerExtensionUi(queryWithAccount, connection);
};

export default registerExtension;
