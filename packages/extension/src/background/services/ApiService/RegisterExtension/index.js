import filterStream from '~utils/filterStream';
import address from '~utils/address';
import validateUserPermission from '../utils/validateUserPermision';
import AuthService from '~background/services/AuthService';
import Web3Service from '~client/services/Web3Service';
import {
    actionEvent,
} from '~config/event';


const registerExtensionUi = async (query, connection) => {
    const {
        account,
    } = query;

    if (account && !account.registeredAt) {
        connection.UiActionSubject.next({
            type: 'ui.register.extension',
            requestId: query.requestId,
            clientId: query.clientId,
            data: {
                response: account,
                requestId: query.requestId,
            },
        });
        return filterStream('UI_RESPONSE', query.requestId, connection.UiResponseSubject.asObservable());
    }
    return query;
};

const signMetaMaskTransaction = (query, connection) => async () => {
    const { userPermission: { account = {} } } = await validateUserPermission(query);

    if (account && !account.registeredAt) {
        connection.ClientActionSubject.next({
            type: actionEvent,
            clientId: query.clientId,
            requestId: query.requestId,
            data: {
                action: 'metamask.register.extension',
                response: {
                    ...account,
                    address: address(account.address),
                },
                requestId: query.requestId,
            },
        });
        return filterStream('ACTION_RESPONSE', query.requestId, connection.ActionResponseSubject.asObservable());
    }

    return query;
};
const sendRegisterTx = (query, connection) => async ({ signature }) => {
    const { userPermission: { account = {} } } = await validateUserPermission(query);

    if (account && !account.registeredAt) {
        return Web3Service
            .useContract('AZTECAccountRegistry')
            .method('registerAZTECExtension')
            .send(address(account.address), account.linkedPublicKey, signature);
    }

    return query;
};

const registerAccount = (query, connection) => async () => {
    const { userPermission: { account = {} } } = await validateUserPermission(query);
    return { ...query, response: account };
};

const registerExtension = async (query, connection) => {
    const { userPermission: { account = {} } } = await validateUserPermission(query);
    if (account && account.registeredAt) {
        return {
            ...query,
            response: account,
        };
    }

    const queryWithAccount = {
        ...query, account: account || { address: address(query.args.currentAddress) },
    };

    await registerExtensionUi(queryWithAccount, connection)
        .then(signMetaMaskTransaction(queryWithAccount, connection))
        .then(sendRegisterTx(queryWithAccount, connection))
        .then(registerAccount(queryWithAccount, connection));
};


export default registerExtension;
