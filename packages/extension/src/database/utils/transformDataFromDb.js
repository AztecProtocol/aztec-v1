import {
    undefinedField,
} from './transformDataForDb';

export default function transformDataFromDb(fields, rawData) {
    if (!rawData) {
        return rawData;
    }

    const data = {};
    fields.forEach((field, i) => {
        if (!Object.is(rawData[i], undefinedField)) {
            data[field] = rawData[i];
        }
    });

    return data;
}
