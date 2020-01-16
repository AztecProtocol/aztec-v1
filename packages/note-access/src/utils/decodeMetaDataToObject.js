import { MIN_BYTES_VAR_LENGTH } from '../config/constants';

const stripPrependedZeroes = (str) => str.replace(/^0{1,}/, '');

/**
 * Decode metaData from string format - the format as it is stored on a note - into
 * an object, according to a passed config.
 *
 * @method decodeMetaDataToObject
 * @param {String} metaDataStr - metaData of an AZTEC note, as a hexadecimal string
 * @param {Array} config - defines the schema of the object to which the metaData will be decoded
 * @param {Number} startOffset - JavaScript number representing the length of any prepended metaData which is
 * not encoded in this note-access package, for example the ephemeralKey associated data
 * @returns {Object} metaDataObj - metaData in object form
 */
export default function decodeMetaDataToObject(metaDataStr, config, startOffset = 0) {
    const formattedMetaDataStr = metaDataStr.startsWith('0x') ? metaDataStr.slice(2) : metaDataStr;
    const offsetOfDynamicDataMapping = [];
    config.forEach((_, idx) => {
        const startOfVars = MIN_BYTES_VAR_LENGTH * idx;
        const dynamicVars = formattedMetaDataStr.substr(startOfVars, MIN_BYTES_VAR_LENGTH);
        offsetOfDynamicDataMapping.push(2 * parseInt(dynamicVars, 16) - startOffset);
    });

    const metaDataObj = {};
    config.forEach(({ name, length, _toString }, i) => {
        const data = [];
        const startOfDynamicData = offsetOfDynamicDataMapping[i];
        const endOfDynamicData =
            offsetOfDynamicDataMapping[i + 1] !== undefined ? offsetOfDynamicDataMapping[i + 1] : formattedMetaDataStr.length;

        const dataStr = formattedMetaDataStr.substring(startOfDynamicData, endOfDynamicData);

        const lengthOfDynamicData =
            length !== undefined
                ? Math.max(length, MIN_BYTES_VAR_LENGTH)
                : endOfDynamicData - startOfDynamicData - MIN_BYTES_VAR_LENGTH;

        const numberOfDynamicData = parseInt(dataStr.slice(0, MIN_BYTES_VAR_LENGTH), 10);

        for (let j = 0; j < numberOfDynamicData; j += 1) {
            const dynamicData = dataStr.substr(lengthOfDynamicData * j + MIN_BYTES_VAR_LENGTH, lengthOfDynamicData);
            let formattedData = length !== undefined ? dynamicData.slice(-length) : stripPrependedZeroes(dynamicData);
            if (_toString) {
                formattedData = _toString(formattedData).replace(/^0x/, '');
            }
            data.push(`0x${formattedData}`);
        }
        const isArrayData = length !== undefined;
        metaDataObj[name] = isArrayData ? data : data[0] || '';
    });

    return metaDataObj;
}
