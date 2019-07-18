import sort from 'lodash/orderBy';

export default function fetchFromData(
    prefixes,
    items,
    {
        first,
        where,
        orderBy,
        orderDirection = 'ASC',
    },
) {
    let filteredItems = !orderBy
        ? items
        : sort(items, orderBy, orderDirection);

    if ('timestamp' in filteredItems[0]) {
        const now = Date.now();
        filteredItems = filteredItems.filter(({ timestamp }) => timestamp <= now);
    }

    prefixes.forEach((prefix) => {
        const toMatch = where[prefix]
            ? [where[prefix]]
            : where[`${prefix}_in`];
        if (toMatch && toMatch.length > 0) {
            filteredItems = filteredItems.filter(item => toMatch.indexOf(item[prefix]) >= 0);
        }

        let toNotMatch = [];
        if (where[`${prefix}_not_in`]) {
            toNotMatch = [...where[`${prefix}_not_in`]];
        }
        if (where[`${prefix}_not`]) {
            toNotMatch.push(where[`${prefix}_not`]);
        }
        if (toNotMatch.length > 0) {
            filteredItems = filteredItems.filter(item => toNotMatch.indexOf(item[prefix]) < 0);
        }

        const gt = where[`${prefix}_gt`];
        if (gt !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] > gt);
        }
        const gte = where[`${prefix}_gte`];
        if (gte !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] >= gte);
        }
        const lt = where[`${prefix}_lt`];
        if (lt !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] < lt);
        }
        const lte = where[`${prefix}_lte`];
        if (lte !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] <= lte);
        }
    });

    return filteredItems.slice(0, first);
}
