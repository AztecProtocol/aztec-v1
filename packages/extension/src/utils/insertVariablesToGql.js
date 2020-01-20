const toValueStr = (val) => {
    switch (typeof val) {
        case 'string':
            return `"${val}"`;
        default:
            return `${val}`;
    }
};

export default function insertVariablesToGql(queryStr, variables) {
    const firstPara = queryStr.indexOf(')');
    const firstBrace = queryStr.indexOf('{');
    const hasQuery = firstPara > 0;
    let insertTo;
    if (hasQuery) {
        insertTo = firstPara;
    } else {
        insertTo = firstBrace;
        do {
            insertTo -= 1;
        } while (queryStr[insertTo] === ' ');
        insertTo += 1;
    }
    const variableStr = Object.keys(variables)
        .map(key => `${key}: ${toValueStr(variables[key])}`)
        .join(', ');

    return [
        queryStr.substr(0, insertTo),
        hasQuery ? ', ' : '(',
        variableStr,
        firstPara > 0 ? '' : ')',
        queryStr.substr(insertTo),
    ].join('');
}
