import mergeActions from '~/database/utils/mergeActions';
import errorAction from '~/database/utils/errorAction';
import dataKey from '~/utils/dataKey';
import setIdKeyMapping from './setIdKeyMapping';
import setData from './setData';

export default async function set(
    data,
    {
        forceReplace = false,
        ignoreDuplicate = false,
    } = {},
) {
    const {
        name,
        fields,
        index,
        dataKeyPattern,
        autoIncrementBy,
    } = this.config;

    let id;
    if (index) {
        id = data[index];
    } else if (dataKeyPattern) {
        id = dataKey(dataKeyPattern, data);
    } else {
        ({ id } = data);
    }

    let key = id;
    let subFieldsKey = '';
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
        const requiredKeys = [];
        if (!index && dataKeyPattern) {
            dataKeyPattern.match(/{([^{}]+)}/ig)
                .forEach(pattern => requiredKeys.push(pattern.substr(1, pattern.length - 2)));
        } else {
            requiredKeys.push(index);
        }
        const requiredStr = requiredKeys
            .map(k => `'${k}'`)
            .join(' or ');
        return errorAction(`${requiredStr} must be presented in ${name} object`);
    }

    let res1;
    if (autoIncrementBy) {
        res1 = await setIdKeyMapping(
            data,
            {
                id,
                name,
                autoIncrementBy,
                dataKeyPattern,
                forceReplace,
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
            id,
            key,
            subFieldsKey,
            fields: subFieldsKey ? fields.fields : fields,
            forceReplace,
            ignoreDuplicate,
        },
    );

    const actions = mergeActions(
        res1,
        res2,
    );

    if (!dataKeyPattern) {
        return actions;
    }

    return {
        key,
        ...actions,
    };
}
