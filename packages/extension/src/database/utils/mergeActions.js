export default function mergeActions(...actions) {
    const mergedData = {};
    const mergedStorage = {};
    const mergedModified = new Set();
    actions
        .filter(a => !!a)
        .forEach(({
            data,
            storage,
            modified,
        }) => {
            Object.keys(data).forEach((key) => {
                mergedData[key] = data[key];
                mergedStorage[key] = storage[key];
            });
            modified.forEach(key => mergedModified.add(key));
        });

    return {
        data: mergedData,
        storage: mergedStorage,
        modified: [...mergedModified],
    };
}
