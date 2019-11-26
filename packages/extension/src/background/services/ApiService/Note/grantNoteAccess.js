import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';

const triggerGrantNoteAccessUi = async (query, connection) => {
    const {
        requestId,
    } = query;

    connection.UiActionSubject.next({
        ...query,
        type: 'ui.note.grantAccess',
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

export default triggerGrantNoteAccessUi;
