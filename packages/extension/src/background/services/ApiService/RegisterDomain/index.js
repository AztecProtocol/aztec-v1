import filterStream from '~utils/filterStream';
import AuthService from '../../AuthService';

const registerDomain = async (query, connection) => {
    const registeredDomain = await AuthService.getRegisteredDomain(query.domain);

    if (!registeredDomain) {
        connection.UiActionSubject.next({
            type: 'ui.asset.approve',
            requestId: query.requestId,
            clientId: query.clientId,
            data: {
                response: {
                    domain: query.domain,
                    ...query.args,
                },
                requestId: query.requestId,
            },
        });
        return filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
    }
    return registeredDomain;
};


export default async (query, connection) => {
    const response = await registerDomain(query, connection);
    return {
        ...query,
        response,
    };
};
