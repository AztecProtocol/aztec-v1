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
        name,
        fields,
        index,
        dataKeyPattern,
    } = this.config;
    let {
        id,
    } = data;
    if (!id
        && data[index]
    ) {
        id = data[index];
    }
    let key = id;
    let subFieldsKey = '';
    let res1;

    let {
        autoIncrementBy,
    } = this.config;
    if (dataKeyPattern
        && !autoIncrementBy
    ) {
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
        const requiredKeys = ['id'];
        if (index && index !== 'id') {
            requiredKeys.push(index);
        }
        const requiredStr = requiredKeys
            .map(k => `'${k}'`)
            .join(' or ');
        return errorAction(`${requiredStr} must be presented in ${name} object`);
    }

    if (dataKeyPattern) {
        res1 = await setIdKeyMapping(
            data,
            {
                id,
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
