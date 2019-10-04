import filterStream from '~utils/filterStream';
import validateUserPermission from '../utils/validateUserPermision';

const registerExtensionUi = async (query, connection) => {
    const {
        account,
    } = query;

    if (account && !account.registeredAtj) {
        connection.UiActionSubject.next({
            type: 'ui.register.extension',
            requestId: query.requestId,
            data: {
                response: {
                    ...account,
                },
                requestId: query.requestId,
            },
        });
        const response = await filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());

        return {
            ...query,
            response,
        };
    }
    return query;
};

const registerExtension = async (query, connection) => {
    const {
        data: { args },
    } = query;
    const response = await validateUserPermission({
        ...args,
        domain: window.location.host,
    });
    const { userPermission: { account = {} } } = response;
    if (account && account.blockNumber) {
        return {
            ...query,
            response: account,
        };
    }

    const queryWithAccount = {
        ...query,
        account: account && account.address ? account : { address: query.data.args.currentAddress },
    };

    return registerExtensionUi(queryWithAccount, connection);
};


export default registerExtension;
