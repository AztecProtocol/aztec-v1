
const generateField = (item, keys) => keys.map(key => item[key]).join('_');

export default function appendAutoFields(item, modelConfig) {
    const {
        autoFields = {},
    } = modelConfig;
    const resultItem = {
        ...item,
    };
    const fields = Object.keys(autoFields);
    fields.forEach((field) => {
        resultItem[field] = generateField(item, autoFields[field]);
    });

    return resultItem;
}
