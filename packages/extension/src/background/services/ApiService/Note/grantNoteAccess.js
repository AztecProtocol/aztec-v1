import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~/utils/filterStream';

const triggerGrantNoteAccessUi = async (query, connection) => {
    const {
        requestId,
    } = query;

    // TODO - return if input addresses have always had access

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
    const {
        success,
        error,
    } = data || {};

    return {
        result: {
            success: !!success,
        },
        error,
    };
};

export default triggerGrantNoteAccessUi;
