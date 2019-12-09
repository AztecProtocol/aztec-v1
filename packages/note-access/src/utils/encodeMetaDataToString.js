import {
    padLeft,
    toHex,
} from 'web3-utils';
import {
    MIN_BYTES_VAR_LENGTH,
} from '../config/constants';

const ensureMinVarSize = str => padLeft(
    str.match(/^0x/i) ? str.slice(2) : str,
    MIN_BYTES_VAR_LENGTH
);

export default function encodeMetaDataToString(metaDataObj, config, startOffset = 0) {
    const variableOffsets = [];
    const variableData = [];

    let dynamicVarsOffset = startOffset + (config.length * MIN_BYTES_VAR_LENGTH);
    config.forEach(({
        name,
        length,
        _toString,
    }) => {
        const dynamicData = metaDataObj[name];
        const numberOfDynamicData = length === undefined
            ? (dynamicData && 1) || 0
            : dynamicData.length;
        variableOffsets.push(ensureMinVarSize(`${toHex(dynamicVarsOffset / 2).slice(2)}`));
        const transform = _toString
            ? data => ensureMinVarSize(_toString(data))
            : ensureMinVarSize;
        if (Array.isArray(dynamicData)) {
            dynamicData.forEach((data) => {
                variableData.push(transform(data));
            });
        } else if (dynamicData) {
            variableData.push(transform(dynamicData));
        }
        dynamicVarsOffset += variableData.slice(-numberOfDynamicData)
            .reduce((accum, data) => accum + data.length, 0);
    });

    if (!variableData.length) {
        return '';
    }

    return [
        '0x',
        variableOffsets.join(''),
        variableData.join(''),
    ].join('');
}
