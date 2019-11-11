import filterStream from '~utils/filterStream';
import validateUserPermission from '../utils/validateUserPermision';
import setNetworkConfig from '../utils/setNetworkConfig';


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

        const response = await filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
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
        networkId,
        currentAddress,
    } = args;

    await setNetworkConfig({
        networkId,
        currentAddress,
    });

    const response = await validateUserPermission({
        ...args,
        domain: window.location.origin,
    });
    const { userPermission: { account = {} } } = response;
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
