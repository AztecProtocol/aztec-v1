import filterStream from '~utils/filterStream';
import address from '~utils/address';
import validateUserPermission from '../utils/validateUserPermision';

const registerExtensionUi = async (query, connection) => {
    const {
        account,
    } = query;

    if (account && !account.registeredAtj) {
        connection.UiActionSubject.next({
            type: 'ui.register.extension',
            requestId: query.requestId,
            clientId: query.clientId,
            data: {
                response: {
                    ...account,
                },
                requestId: query.requestId,
                clientId: query.clientId,
            },
        });
        return filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
    }
    return query;
};


const registerExtension = async (query, connection) => {
    const response = await validateUserPermission(query);
    const { userPermission: { account = {} } } = response;
    if (account && account.registeredAt) {
        return {
            ...query,
            response: account,
        };
    }

    const queryWithAccount = {
        ...query,
        account: account && account.address ? account : { address: address(query.data.args.currentAddress) },
    };

    return registerExtensionUi(queryWithAccount, connection);
};


export default registerExtension;
