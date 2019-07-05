const undefinedField = -0; // it has less bytes than '' or null or undefined

export default function transformDataForDb(fields, rawData) {
    const data = [];
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
