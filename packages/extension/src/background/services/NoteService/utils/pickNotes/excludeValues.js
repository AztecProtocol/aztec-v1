export default function excludeValues(sortedValues, excludes) {
    let validValues = sortedValues;
    if (excludes && excludes.length > 0) {
        const toBeExcludes = {};
        excludes.forEach((value) => {
            if (!toBeExcludes[value]) {
                toBeExcludes[value] = 0;
            }
            toBeExcludes[value] += 1;
        });
        validValues = sortedValues.filter((value) => {
            const count = toBeExcludes[value];
            if (count > 0) {
                toBeExcludes[value] -= 1;
            }
            return !count;
        });
    }
    return validValues;
}
