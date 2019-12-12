import { MIN_BYTES_VAR_LENGTH } from '../config/constants';

const stripPrependedZeroes = (str) => str.replace(/^0{1,}/, '');

export default function decodeMetaDataToObject(metaDataStr, config, startOffset = 0) {
    const formattedMetaDataStr = metaDataStr.startsWith('0x') ? metaDataStr.slice(2) : metaDataStr;
    const offsetOfDynamicDataMapping = [];
    config.forEach((_, idx) => {
        const startOfVars = MIN_BYTES_VAR_LENGTH * idx;
        const dynamicVars = formattedMetaDataStr.substr(startOfVars, MIN_BYTES_VAR_LENGTH);
        offsetOfDynamicDataMapping.push(2 * parseInt(dynamicVars, 16) - startOffset);
    });

    const metaDataObj = {};
    config.forEach(({ name, length }, i) => {
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
            const formattedData = length !== undefined ? dynamicData.slice(-length) : stripPrependedZeroes(dynamicData);
            data.push(`0x${formattedData}`);
        }
        const isArrayData = length !== undefined;
        metaDataObj[name] = isArrayData ? data : data[0] || '';
    });

    return metaDataObj;
}
