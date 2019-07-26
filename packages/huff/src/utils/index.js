const BN = require('bn.js');

const utils = {};

utils.formatEvenBytes = (bytes) => {
    if ((Math.floor(bytes.length / 2) * 2) !== bytes.length) {
        return `0${bytes}`;
    }
    return bytes;
};

utils.toHex = (integer) => {
    return new BN(integer, 10).toString(16);
};

utils.padNBytes = (hex, numBytes) => {
    if (hex.length > (numBytes * 2)) {
        throw new Error(`value ${hex} has more than ${numBytes} bytes!`);
    }
    let result = hex;
    while (result.length < (numBytes * 2)) {
        result = `0${result}`;
    }
    return result;
};


utils.normalize = (number) => {
    const max = new BN(2).pow(new BN(256));
    if (number.lt(new BN(0))) {
        return number.umod(max);
    }
    if (number.gt(max.sub(new BN(1)))) {
        return number.umod(max);
    }
    return number;
};

utils.sliceCommasIgnoringTemplates = (argumentsString) => {
    function getIndexesOfCommasThatSplitTopLevelElements(regexMatches) {
        let depth = 0;
        const commaIndexes = [];
        // eslint-disable-next-line consistent-return
        regexMatches.forEach((regexMatch) => {
            if (regexMatch[0] === '<') {
                depth += 1;
            } else if (regexMatch[0] === '>') {
                depth -= 1;
            } else if (regexMatch[0] === ',' && depth === 0) {
                commaIndexes.push(regexMatch[1]);
                return regexMatch[1];
            }
        });
        return commaIndexes;
    }

    function matchesForCommasAndAngleBrackets(argumentsStringLocal) {
        const commasAndAngleBracketsRegex = new RegExp('[,<>]');
        let argumentsStringProcessedSoFar = argumentsStringLocal;
        const results = [];
        let currentIndexInOverallString = 0;
        while (argumentsStringProcessedSoFar.match(commasAndAngleBracketsRegex)) {
            const regexMatchForCommaOrAngleBracket = argumentsStringProcessedSoFar.match(commasAndAngleBracketsRegex);
            currentIndexInOverallString += regexMatchForCommaOrAngleBracket.index + 1;
            results.push([regexMatchForCommaOrAngleBracket[0], currentIndexInOverallString]);
            argumentsStringProcessedSoFar = argumentsStringProcessedSoFar.slice(regexMatchForCommaOrAngleBracket.index + 1);
        }
        return results;
    }

    function splitStringByIndexes(inputString, indexes) {
        const locationsToSliceArguments = [0].concat(indexes);
        const topLevelArguments = [];
        let input = inputString;
        for (let i = locationsToSliceArguments.length - 1; i >= 0; i -= 1) {
            topLevelArguments.push(input.slice(locationsToSliceArguments[i]).replace(' ', ''));
            input = input.slice(0, locationsToSliceArguments[i] - 1);
        }
        return topLevelArguments;
    }

    const indexesOfCommasAndAngleBrackets = matchesForCommasAndAngleBrackets(argumentsString);
    const topLevelArguments = splitStringByIndexes(argumentsString,
        getIndexesOfCommasThatSplitTopLevelElements(indexesOfCommasAndAngleBrackets));
    return (topLevelArguments.reverse());
};


module.exports = utils;
