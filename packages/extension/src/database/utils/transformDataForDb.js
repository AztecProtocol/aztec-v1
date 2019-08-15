const undefinedField = -0; // it has less bytes than '' or null or undefined

export default function transformDataForDb(fieldsConfig, rawData) {
    const data = [];

    const fields = Array.isArray(fieldsConfig)
        ? fieldsConfig
        : fieldsConfig.fields;

    fields.forEach((field, i) => {
        if (rawData && (field in rawData)) {
            data[i] = rawData[field];
        } else {
            data[i] = undefinedField;
        }
    });

    return data;
}

export {
    undefinedField,
};
