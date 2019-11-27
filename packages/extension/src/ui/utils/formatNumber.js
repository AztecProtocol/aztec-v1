const isFloatValue = value => `${value}`.indexOf('.') >= 0;

const shiftRight10 = (intValue, count) => {
    const strVal = `${intValue}`;
    const cutAt = Math.max(0, strVal.length - count);
    const intStr = strVal.substr(0, cutAt) || '0';
    const fractionStr = strVal.length > count
        ? strVal.substr(cutAt)
        : strVal.padStart(count, '0');
    return fractionStr
        ? `${intStr}.${fractionStr}`
        : intStr;
};

const formatInt = (intValue) => {
    const intStr = `${intValue}`;
    const segCount = Math.ceil(intStr.length / 3);
    const segments = [];
    for (let i = 0; i < segCount; i += 1) {
        const end = intStr.length - (3 * i);
        const start = Math.max(0, end - 3);
        segments[segCount - i - 1] = intStr.substring(start, end);
    }
    return segments.join(',');
};

const formatFraction = (fractionValue, decimals) => {
    if (!fractionValue
        || decimals === 0
        || fractionValue.match(/^0{0,}$/)
    ) {
        return '';
    }
    return fractionValue
        .substr(0, decimals)
        .replace(/0{1,}$/, '');
};

export default function formatNumber(value, decimals) {
    let floatValue = value;
    if (decimals > 0 && !isFloatValue(floatValue)) {
        floatValue = shiftRight10(floatValue, decimals);
    }

    const [intValue, fractionValue] = `${floatValue}`.split('.');
    const intStr = formatInt(intValue);
    const fractionStr = formatFraction(fractionValue, decimals);

    return fractionStr
        ? `${intStr}.${fractionStr}`
        : intStr;
}
