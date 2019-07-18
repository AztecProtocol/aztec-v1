export default function filterByWhere(where, prefixes, items) {
    let filteredItems = items;
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

    return filteredItems;
}
