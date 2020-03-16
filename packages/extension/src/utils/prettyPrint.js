const indent = (strArr, indentSize) => {
    const whitespaces = ''.padStart(indentSize, ' ');
    if (typeof strArr === 'string') {
        return `${whitespaces}${strArr}`;
    }

    return strArr.map(str => `${whitespaces}${str}`);
};

const formatObject = (obj, indentSize) => {
    let lines = [];
    switch (typeof obj) {
        case 'string':
            lines.push(`'${obj.replace(/'/g, "\\'")}'`);
            break;
        case 'number':
        case 'boolean':
            lines.push(`${obj}`);
            break;
        case 'object': {
            if (Array.isArray(obj)) {
                lines.push('[');
                obj.forEach((value) => {
                    const childLines = formatObject(value);
                    if (childLines.length === 1) {
                        lines.push(indent(`${childLines[0]},`, indentSize));
                    } else {
                        lines = [
                            ...lines,
                            indent(`${childLines[0]}`, indentSize),
                            ...indent(childLines.slice(1, -1), indentSize),
                            indent(`${childLines[childLines.length - 1]},`, indentSize),
                        ];
                    }
                });
                lines.push(']');
            } else {
                lines.push('{');
                Object.keys(obj).forEach((key) => {
                    const childLines = formatObject(obj[key]);
                    if (childLines.length === 1) {
                        lines.push(indent(`${key}: ${childLines[0]},`, indentSize));
                    } else {
                        lines = [
                            ...lines,
                            indent(`${key}: ${childLines[0]}`, indentSize),
                            ...indent(childLines.slice(1, -1), indentSize),
                            indent(`${childLines[childLines.length - 1]},`, indentSize),
                        ];
                    }
                });
                lines.push('}');
            }
            break;
        }
        default:
    }

    return lines;
};

export default function prettyPrint(obj, indentSize = 4) {
    const lines = formatObject(obj, indentSize);
    return lines.join('\n');
}
