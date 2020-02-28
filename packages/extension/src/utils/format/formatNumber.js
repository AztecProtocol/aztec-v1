const isFloatValue = strVal => strVal.indexOf('.') >= 0;

const shiftRight10 = (strVal, count) => {
    const cutAt = Math.max(0, strVal.length - count);
    const intStr = strVal.substr(0, cutAt) || '0';
    const fractionStr = strVal.length > count
        ? strVal.substr(cutAt)
        : strVal.padStart(count, '0');
    return fractionStr
        ? `${intStr}.${fractionStr}`
        : intStr;
};

const formatInt = (strVal) => {
    const segCount = Math.ceil(strVal.length / 3);
    const segments = [];
    for (let i = 0; i < segCount; i += 1) {
        const end = strVal.length - (3 * i);
        const start = Math.max(0, end - 3);
        segments[segCount - i - 1] = strVal.substring(start, end);
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

export default function formatNumber(value, decimals, formatInteger = true) {
    let strVal = `${value}`;
    if (decimals > 0 && !isFloatValue(strVal)) {
        strVal = shiftRight10(strVal, decimals);
    }

    const [intValue, fractionValue] = strVal.split('.');
    const intStr = formatInteger ? formatInt(intValue) : intValue;
    const fractionStr = formatFraction(fractionValue, decimals);

    return fractionStr
        ? `${intStr}.${fractionStr}`
        : intStr;
}
