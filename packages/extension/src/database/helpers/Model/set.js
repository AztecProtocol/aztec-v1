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
    let key = id;
    let subFieldsKey = '';
    let res1;

    if (!autoIncrementBy) {
        autoIncrementBy = `${name}Count`;
    }

    if (!Array.isArray(fields)) {
        key = name;
        subFieldsKey = data[fields.key];

        if (!subFieldsKey) {
            return errorAction(`'${fields.key}' must be presented in ${name} object`);
        }
    }

    if (!id
        && (dataKeyPattern || !subFieldsKey)
    ) {
        return errorAction(`'id' must be presented in ${name} object`);
    }

    if (dataKeyPattern) {
        res1 = await setIdKeyMapping(
            data,
            {
                name,
                autoIncrementBy,
                dataKeyPattern,
                ignoreDuplicate: true,
            },
        );

        ({
            data: {
                [id]: key,
            },
        } = res1);
    }

    const res2 = await setData(
        data,
        {
            name,
            key,
            subFieldsKey,
            fields: subFieldsKey ? fields.fields : fields,
            forceUpdate,
            ignoreDuplicate,
        },
    );

    return mergeActions(
        res1,
        res2,
    );
}
