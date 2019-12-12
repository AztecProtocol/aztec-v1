import { MIN_BYTES_VAR_LENGTH } from '../config/constants';
import ensureMinVarSize from './ensureMinVarSize';
import to32ByteOffset from './to32ByteOffset';

export default function encodeMetaDataToString(metaDataObj, config, startOffset = 0) {
    const variableOffsets = [];
    const variableData = [];

    let dynamicVarsOffset = startOffset + config.length * MIN_BYTES_VAR_LENGTH;
    let accumNumberOfDynamicData = 0;
    config.forEach(({ name, length, _toString }) => {
        const dynamicData = metaDataObj[name];
        const isDynamicArray = length !== undefined;
        const numberOfDynamicData = isDynamicArray ? (dynamicData && dynamicData.length) || 0 : (dynamicData && 1) || 0;
        accumNumberOfDynamicData += numberOfDynamicData;

        variableOffsets.push(to32ByteOffset(dynamicVarsOffset));

        variableData.push(ensureMinVarSize(numberOfDynamicData));

        if (dynamicData) {
            const transformData = _toString ? (data) => ensureMinVarSize(_toString(data)) : ensureMinVarSize;
            if (isDynamicArray) {
                dynamicData.forEach((data) => {
                    variableData.push(transformData(data));
                });
            } else {
                variableData.push(transformData(dynamicData));
            }
        }

        dynamicVarsOffset += variableData.slice(-(numberOfDynamicData + 1)).reduce((accum, data) => accum + data.length, 0);
    });

    if (!accumNumberOfDynamicData) {
        return '';
    }

    return ['0x', variableOffsets.join(''), variableData.join('')].join('');
}
