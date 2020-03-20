import {
    parseValue,
} from '../transformData';

test('parseValue', () => {
    expect(parseValue(1234)).toEqual({
        sign: '',
        unsignedValue: '1234',
        integerValue: '1234',
        decimals: '',
    });

    expect(parseValue('1234')).toEqual({
        sign: '',
        unsignedValue: '1234',
        integerValue: '1234',
        decimals: '',
    });

    expect(parseValue('12,345')).toEqual({
        sign: '',
        unsignedValue: '12345',
        integerValue: '12345',
        decimals: '',
    });

    expect(parseValue(-123)).toEqual({
        sign: '-',
        unsignedValue: '123',
        integerValue: '123',
        decimals: '',
    });

    expect(parseValue('-1,234,567')).toEqual({
        sign: '-',
        unsignedValue: '1234567',
        integerValue: '1234567',
        decimals: '',
    });

    expect(parseValue('1,234,567,890,123,456,789')).toEqual({
        sign: '',
        unsignedValue: '1234567890123456789',
        integerValue: '1234567890123456789',
        decimals: '',
    });

    expect(parseValue(1000.12)).toEqual({
        sign: '',
        unsignedValue: '1000.12',
        integerValue: '1000',
        decimals: '12',
    });

    expect(parseValue('12,345.001')).toEqual({
        sign: '',
        unsignedValue: '12345.001',
        integerValue: '12345',
        decimals: '001',
    });

    expect(parseValue('-1,234,567.890')).toEqual({
        sign: '-',
        unsignedValue: '1234567.89',
        integerValue: '1234567',
        decimals: '89',
    });

    expect(parseValue('-1,234,567.000')).toEqual({
        sign: '-',
        unsignedValue: '1234567',
        integerValue: '1234567',
        decimals: '',
    });

    expect(parseValue(0)).toEqual({
        sign: '',
        unsignedValue: '0',
        integerValue: '0',
        decimals: '',
    });

    expect(parseValue('')).toEqual({
        sign: '',
        unsignedValue: '',
        integerValue: '',
        decimals: '',
    });

    expect(parseValue('00012')).toEqual({
        sign: '',
        unsignedValue: '12',
        integerValue: '12',
        decimals: '',
    });

    expect(parseValue('-00012')).toEqual({
        sign: '-',
        unsignedValue: '12',
        integerValue: '12',
        decimals: '',
    });

    expect(parseValue('-00012.0012')).toEqual({
        sign: '-',
        unsignedValue: '12.0012',
        integerValue: '12',
        decimals: '0012',
    });
});
