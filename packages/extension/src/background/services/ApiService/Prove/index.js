import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';
import responseDataKeys from './responseDataKeys';

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

    if (data.error) {
        return data;
    }

    const formatData = {
        success: data.success || false,
    };
    const dataKeys = responseDataKeys[proofType];
    if (dataKeys) {
        dataKeys.forEach((key) => {
            formatData[key] = data[key];
        });
    }

    return {
        proof: formatData,
    };
}
