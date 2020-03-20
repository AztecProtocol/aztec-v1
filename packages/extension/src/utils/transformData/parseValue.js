export default function parseValue(value) {
    const [,
        sign = '',
        numberValue = '',
    ] = `${value}`.match(/^(-)?(.{0,})$/) || [];
    const unsignedStrValue = numberValue === '0'
        ? numberValue
        : numberValue
            .replace(/,/g, '')
            .replace(/^0{1,}/, '');
    const [,
        integerValue = '',
        decimalsStr = '',
    ] = unsignedStrValue.match(/^([0-9]{0,})\.?([0-9]{0,})$/) || [];
    const decimals = decimalsStr.replace(/0{1,}$/, '');
    const unsignedValue = decimals
        ? `${integerValue || '0'}.${decimals}`
        : integerValue;

    return {
        sign,
        unsignedValue,
        integerValue,
        decimals,
    };
}
