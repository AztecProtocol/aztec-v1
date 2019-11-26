import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';

export default async function triggerProofUi(query, connection) {
    const {
        data: {
            args: {
                proofType,
                ...rest
            },
        },
    } = query;
    connection.UiActionSubject.next({
        type: `ui.asset.prove.${proofType.toLowerCase()}`,
        requestId: query.requestId,
        clientId: query.clientId,
        data: rest,
    });

    const {
        data,
    } = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    ) || {};

    return data;
}
