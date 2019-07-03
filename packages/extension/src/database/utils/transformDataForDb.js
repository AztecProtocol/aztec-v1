export default function transformDataForDb(fields, rawData) {
    return fields.map(field => rawData[field]);
}
