import {
    MIN_BYTES_VAR_LENGTH,
} from '../config/constants';

const stripPrependedZeroes = str => str.replace(/^0{1,}/, '');
const formatData = str => `0x${stripPrependedZeroes(str)}`;

export default function decodeMetaDataToObject(metaDataStr, config, startOffset = 0) {
    const formattedMetaDataStr = metaDataStr.startsWith('0x')
        ? metaDataStr.slice(2)
        : metaDataStr;

    const offsetOfDynamicDataMapping = [];
    config.forEach((_, idx) => {
        const startOfVars = MIN_BYTES_VAR_LENGTH * idx;
        const dynamicVars = formattedMetaDataStr.substr(startOfVars, MIN_BYTES_VAR_LENGTH);
        offsetOfDynamicDataMapping.push((2 * parseInt(dynamicVars, 16)) - startOffset);
    });

    const metaDataObj = {};
    config.forEach(({
        name,
        length,
    }, i) => {
        const startOfDynamicData = offsetOfDynamicDataMapping[i];

        // if no length, var must be last element in metaData
        if (length === undefined) {
            const dynamicData = formattedMetaDataStr.substr(startOfDynamicData);
            metaDataObj[name] = formatData(dynamicData);
            return;
        }

        const data = [];
        const endOfDynamicData = offsetOfDynamicDataMapping[i + 1];
        const dataStr = formattedMetaDataStr.substring(startOfDynamicData, endOfDynamicData);
        const lengthOfDynamicData = Math.max(length, MIN_BYTES_VAR_LENGTH);
        const numberOfDynamicData = dataStr.length / lengthOfDynamicData;
        for (let j = 0; j < numberOfDynamicData; j += 1) {
            const dynamicData = dataStr.substr(
                lengthOfDynamicData * j,
                lengthOfDynamicData,
            );
            data.push(formatData(dynamicData));
        }
        metaDataObj[name] = data;
    });

    return metaDataObj;
}
