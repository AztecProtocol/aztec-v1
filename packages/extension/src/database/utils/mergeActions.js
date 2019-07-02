export default function mergeActions(...actions) {
    const mergedData = {};
    const mergedModified = new Set();
    actions.forEach(({
        data,
        modified,
    }) => {
        Object.keys(data).forEach((key) => {
            mergedData[key] = data[key];
        });
        modified.forEach(key => mergedModified.add(key));
    });

    return {
        data: mergedData,
        modified: [...mergedModified],
    };
}
