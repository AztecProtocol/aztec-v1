import BN from 'bn.js';
import parseValue from './parseValue';

export default function tokenToNoteValue({
    value,
    scalingFactor,
    decimals,
}) {
    const {
        integerValue,
        decimals: decimalValue,
    } = parseValue(value);

    let noteValue = new BN(`${integerValue}${decimalValue}`);

    const totalDecimals = decimals - decimalValue.length;
    if (totalDecimals !== 0) {
        const decimalRatio = (new BN(10)).pow(new BN(Math.abs(totalDecimals)));
        noteValue = totalDecimals > 0
            ? noteValue.mul(decimalRatio)
            : noteValue.div(decimalRatio);
    }

    if (+scalingFactor !== 1) {
        const scalingRatio = new BN(scalingFactor);
        noteValue = noteValue.div(scalingRatio);
    }

    return noteValue.toNumber();
}
