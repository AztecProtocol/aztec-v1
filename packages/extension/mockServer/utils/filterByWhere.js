export default function filterByWhere(where, prefixes, items) {
    let filteredItems = items;
    prefixes.forEach((prefix) => {
        const toMatch = where[prefix]
            ? [where[prefix]]
            : where[`${prefix}_in`];
        if (toMatch && toMatch.length > 0) {
            filteredItems = filteredItems.filter(item => toMatch.indexOf(item[prefix]) >= 0);
        }
    });

    return filteredItems;
}
