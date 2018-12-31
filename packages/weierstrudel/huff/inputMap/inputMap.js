// An 'input map'...ish?

const inputMap = {};

inputMap.createInputMap = (fileData) => {
    let currentIndex = 0;
    return fileData.reduce((accumulator, { filename, data }) => {
        const { length } = data;
        const oldIndex = currentIndex;
        currentIndex += length;
        return {
            files: [
                ...accumulator.files,
                { filename, data },
            ],
            startingIndices: [...accumulator.startingIndices, oldIndex],
        };
    }, { files: [], startingIndices: [] });
};

inputMap.getFileLine = (charIndex, map) => {
    const filenameIndex = map.startingIndices.findIndex((index, i) => {
        if (i === map.startingIndices.length - 1) {
            return true;
        }
        const next = map.startingIndices[i + 1];
        return (charIndex >= index && charIndex < next);
    });
    if (filenameIndex === -1) {
        throw new Error(`could not find input corresponding to character index ${charIndex}`);
    }
    const { filename, data } = map.files[filenameIndex];
    const charPosition = charIndex - map.startingIndices[filenameIndex];
    const sliced = data.slice(0, charPosition);
    const lines = sliced.split(RegExp('\\r\\n|\\r|\\n'));
    const lineNumber = lines.length - 1;
    const lineIndex = lines[lines.length - 1].length;// charIndex - lines[lines.length - 1].length;
    const line = data.slice(charPosition - lineIndex).match(RegExp('^(.*)'))[0];
    return {
        filename,
        line,
        lineNumber,
        lineIndex,
    };
};

module.exports = inputMap;
