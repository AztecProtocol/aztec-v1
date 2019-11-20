import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import AuthService from '~/background/services/AuthService';

const registerDomain = async (query, connection) => {
    const {
        domain,
    } = query;
    const {
        webClientId,
        requestId,
        data: {
            args,
        },
    } = query;
    const senderPort = connection.connections[webClientId];
    if (!senderPort) {
        return null;
    }

    connection.UiActionSubject.next({
        ...query,
        type: 'ui.domain.approve',
        data: {
            ...args,
            domain: {
                domain,
            },
        },
    });

    const resp = await filterStream(
        uiReturnEvent,
        requestId,
        connection.MessageSubject.asObservable(),
    );
    const {
        data: {
            domain: registeredDomain,
        } = {},
    } = resp || {};

    return registeredDomain;
};


export default async (query, connection) => {
    const {
        domain,
    } = query;
    let registeredDomain = await AuthService.getRegisteredDomain(domain);
    if (!registeredDomain) {
        registeredDomain = await registerDomain(query, connection);
    }

    return {
        ...query,
        data: {
            domain: registeredDomain,
        },
    };
};
