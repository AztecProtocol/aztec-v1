export default function transformDataFromDb(fields, rawData) {
    const data = {};
    if (!rawData) {
        return data;
    }

    fields.forEach((field, i) => {
        if (rawData[i] !== undefined) {
            data[field] = rawData[i];
        }
    });

    return data;
}
