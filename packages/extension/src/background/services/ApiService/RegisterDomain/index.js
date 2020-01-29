import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';
import AuthService from '~/background/services/AuthService';

const registerDomainUi = async (query, connection) => {
    const {
        requestId,
        domain,
        data: {
            args,
            ...rest
        },
    } = query;

    connection.UiActionSubject.next({
        ...query,
        type: 'ui.domain.approve',
        data: {
            ...rest,
            args: {
                ...args,
                domain: {
                    domain,
                },
            },
        },
    });

    return filterStream(
        uiReturnEvent,
        requestId,
        connection.MessageSubject.asObservable(),
    );
};

export default async function registerDomain(query, connection) {
    const {
        domain,
    } = query;
    let registeredDomain = await AuthService.getRegisteredDomain(domain);
    let error;
    if (!registeredDomain) {
        ({
            data: {
                domain: registeredDomain,
                error,
            } = {},
        } = await registerDomainUi(query, connection) || {});
    }

    return {
        domain: registeredDomain,
        error,
    };
}
