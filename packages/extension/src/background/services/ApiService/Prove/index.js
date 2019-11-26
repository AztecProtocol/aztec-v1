import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';

export default async function triggerProofUi(query, connection) {
    const {
        data: {
            args: {
                proofType,
            },
        },
    } = query;

    connection.UiActionSubject.next({
        ...query,
        type: `ui.asset.prove.${proofType.toLowerCase()}`,
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
