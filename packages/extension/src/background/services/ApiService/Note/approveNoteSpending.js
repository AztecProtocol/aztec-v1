import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';

const triggerApproveNoteSpending = async (query, connection) => {
    const {
        requestId,
    } = query;

    connection.UiActionSubject.next({
        ...query,
        type: 'ui.note.approveSpending',
    });

    const {
        data,
    } = await filterStream(
        uiReturnEvent,
        requestId,
        connection.MessageSubject.asObservable(),
    ) || {};

    return data;
};

export default triggerApproveNoteSpending;
