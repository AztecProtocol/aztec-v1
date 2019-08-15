import {
    undefinedField,
} from './transformDataForDb';

export default function transformDataFromDb(fieldsConfig, rawData) {
    if (!rawData
        || !Array.isArray(rawData)
    ) {
        return null;
    }

    const fields = Array.isArray(fieldsConfig)
        ? fieldsConfig
        : fieldsConfig.fields;

    const data = {};
    fields.forEach((field, i) => {
        if (!Object.is(rawData[i], undefinedField)) {
            data[field] = rawData[i];
        }
    });

    return data;
}
