const regex = {};

const commas = new RegExp('[^,\\s\\n]*', 'g');
const spaces = new RegExp('^[\\s\\n]*');
const operators = new RegExp('[\\+\\-\\*]');
// const characters = new RegExp('[g-zG-Z*]');

// const angleBrackets = new RegExp('^[^<>]*');

regex.sliceCommas = (input) => {
    return (input.match(commas) || []).filter(r => r !== '');
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
        return [
            val.slice(0, index),
            regex.isolateTemplate(val.slice(index + 1, val.lastIndexOf('>'))),
        ];
    }
    return [val];
    // const match = input.match(angleBrackets) || [''];
    // return match[0].includes(' ') ? null : match[0];
};

regex.containsOperatorsAndIsNotStackOp = (input) => {
    return operators.test(input) && !input.includes('dup') && !input.includes('swap'); // .test(input);
};

/**
 * Returns whether a string represents a number or not (either dec or hex)
 * @param input string to be matched
 * @returns {boolean} whether the string can feasibly represent a number
 */
regex.isLiteral = (input) => {
    if (regex.containsOperatorsAndIsNotStackOp(input)
        || input.match(new RegExp('^(?:\\s*\\n*)*((0x[0-9a-fA-F]+)|(\\d+))\\b'))) {
        return true;
    }
    return false;
};

regex.isModifiedOpcode = (input) => {
    return input.match(new RegExp('\\s*(dup|swap)(0x[0-9a-fA-F]+|\\d+)([+\\-])(0x[0-9a-fA-F]+|\\d+)\\s*'));
};

regex.removeSpacesAndLines = (input) => {
    return input.replace(/(\r\n\t|\n|\r\t|\s)/gm, '');
};

/**
 * Check that input conforms to name rules (must contain at least one alphabetical character and cannot begin with "0x")
 * @param input
 */
regex.conformsToNameRules = (input) => {
    return !!input.match(new RegExp('^(?!0x.*$)\\w*[A-Za-z]\\w*'));
};

module.exports = regex;
