import {
    noteToTokenValue,
} from '~/utils/transformData';

export default function noteValueToToken(noteValue, asset, format = true) {
    const {
        scalingFactor,
        decimals,
    } = asset;

    return noteToTokenValue({
        value: noteValue,
        scalingFactor,
        decimals,
        format,
    });
}
