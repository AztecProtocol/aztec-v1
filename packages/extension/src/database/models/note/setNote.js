import mergeActions from '~database/utils/mergeActions';
import errorAction from '~database/utils/errorAction';
import setNoteIdKeyMapping from './setNoteIdKeyMapping';
import setNoteData from './setNoteData';

export default async function setNote(
    note,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
    } = {},
) {
    const {
        id,
        ...data
    } = note;
    if (!id) {
        return errorAction("'id' must be presented in note object");
    }

    const res1 = await setNoteIdKeyMapping(
        id,
        {
            ignoreDuplicate: true,
        },
    );

    const {
        data: {
            [id]: key,
        },
    } = res1;
    const res2 = await setNoteData(
        {
            ...data,
            key,
        },
        {
            forceUpdate,
            ignoreDuplicate,
        },
    );

    return mergeActions(
        res1,
        res2,
    );
}
