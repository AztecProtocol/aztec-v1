const regex = {};

const commas = new RegExp('[^,\\s\\n]*', 'g');
const spaces = new RegExp('^[\\s\\n]*');
const operators = new RegExp('[\\+\\-\\*]');

// const angleBrackets = new RegExp('^[^<>]*');

regex.sliceCommas = (input) => {
    return (input.match(commas) || []).filter((r) => {
        return r !== '';
    });
};

regex.endOfData = (input) => {
    return !RegExp('\\S').test(input);
};

regex.countEmptyChars = (input) => {
    const match = input.match(spaces);
    if (match) {
        return match[0].length;
    }
    return 0;
};

regex.isolateTemplate = (val) => {
    const index = val.indexOf('<');
    if (index !== -1) {
        return [val.slice(0, index), regex.isolateTemplate(val.slice(index + 1, val.lastIndexOf('>')))];
    }
    return [val];
    // const match = input.match(angleBrackets) || [''];
    // return match[0].includes(' ') ? null : match[0];
};

regex.containsOperators = (input) => {
    return operators.test(input);
};

regex.isLiteral = (input) => {
    if (regex.containsOperators(input)) {
        return true;
    }
    if (input.match(new RegExp('^(?:\\s*\\n*)*0x([0-9a-fA-F]+)\\b'))) {
        return true;
    }
    if (input.match(new RegExp('^(?:\\s*\\n*)*(\\d+)\\b'))) {
        return true;
    }
    return false;
};

regex.removeSpacesAndLines = (input) => {
    return input.replace(/(\r\n\t|\n|\r\t|\s)/gm, '');
};

module.exports = regex;
