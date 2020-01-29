import {
    undefinedField,
} from './transformDataForDb';

export default function transformToDbData(fields, rawData) {
    if (!rawData
        || typeof rawData !== 'object'
    ) {
        return null;
    }

    const data = {};
    fields.forEach((field) => {
        if (!Object.is(rawData[field], undefinedField)) {
            data[field] = rawData[field];
        }
    });

    return data;
}
