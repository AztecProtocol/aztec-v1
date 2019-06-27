export default function findEntityByKey(source, conditions) {
    let result;
    Object.keys(conditions)
        .some((key) => {
            const toMatch = conditions[key];
            result = source.find(a => a[key] === toMatch);

            return !!result;
        });

    return result || null;
}
