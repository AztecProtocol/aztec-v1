const regex = {};

const commas = new RegExp('[^,\\s\\n]*', 'g');

regex.sliceCommas = (input) => {
    return (input.match(commas) || []).filter(r => r !== '');
};

regex.endOfData = (input) => {
    return !RegExp('\\S').test(input);
};

regex.getToken = (input) => {
    const val = input.match(RegExp('\\s*\\n*([^\\s]*)\\s*\\n*'));
    if (val) {
        return { token: val[1], length: val[0].length };
    }
    return null;
};

module.exports = regex;
