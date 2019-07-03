import mergeActions from '~database/utils/mergeActions';
import errorAction from '~database/utils/errorAction';
import setIdKeyMapping from './setIdKeyMapping';
import setData from './setData';

export default async function set(
    data,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
    } = {},
) {
    const {
        id,
    } = data;

    const {
        name,
        fields,
        dataKeyPattern,
    } = this.config;
    let {
        autoIncrementBy,
    } = this.config;
    if (!autoIncrementBy) {
        autoIncrementBy = `${name}Count`;
    }

    if (!id) {
        return errorAction(`'id' must be presented in ${name} object`);
    }

    const res1 = await setIdKeyMapping(
        data,
        {
            name,
            autoIncrementBy,
            dataKeyPattern,
            ignoreDuplicate: true,
        },
    );

    const {
        data: {
            [id]: key,
        },
    } = res1;

    const res2 = await setData(
        {
            ...data,
            key,
        },
        {
            name,
            fields,
            forceUpdate,
            ignoreDuplicate,
        },
    );

    return mergeActions(
        res1,
        res2,
    );
}
