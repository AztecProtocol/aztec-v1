
const generateField = (item, config) => config.childFields.map(key => item[key]).join('_');

export default function appendAutoFields(item, modelConfig) {
    const {
        autoFields = {},
        hasAutoFields,
    } = modelConfig;

    if (!hasAutoFields) return item;

    const resultItem = {
        ...item,
    };
    const fields = Object.keys(autoFields);
    fields.forEach((field) => {
        resultItem[field] = generateField(item, autoFields[field]);
    });

    return resultItem;
}
