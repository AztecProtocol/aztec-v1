export default function filterByWhere(where, prefixes, items) {
    let filteredItems = items;
    prefixes.forEach((prefix) => {
        const toMatch = where[prefix]
            ? [where[prefix]]
            : where[`${prefix}_in`];
        if (toMatch && toMatch.length > 0) {
            filteredItems = filteredItems.filter(item => toMatch.indexOf(item[prefix]) >= 0);
        }

        const gt = where[`${prefix}_gt`];
        if (gt !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] > gt);
        }

        const lt = where[`${prefix}_lt`];
        if (lt !== undefined) {
            filteredItems = filteredItems.filter(item => item[prefix] < lt);
        }
    });

    return filteredItems;
}
