export default function getFetchConditions(keys, args) {
    const conditions = {};
    keys.forEach((key) => {
        if (!(key in args)) return;
        conditions[key] = args[key];
    });

    return conditions;
}

export const makeGetFetchConditions = keys => args => getFetchConditions(keys, args);
