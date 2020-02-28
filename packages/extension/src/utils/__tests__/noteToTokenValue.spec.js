import {
    noteToTokenValue,
} from '../transformData';

test('noteToTokenValue with interger value', () => {
    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '1',
        decimals: 0,
    })).toBe('123');

    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '100',
        decimals: 0,
    })).toBe('12300');
});

test('noteToTokenValue with decimals', () => {
    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '1',
        decimals: 1,
    })).toBe('12.3');

    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '1',
        decimals: 4,
    })).toBe('0.0123');

    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('12.3');

    expect(noteToTokenValue({
        value: '123',
        scalingFactor: '100',
        decimals: 2,
    })).toBe('123');

    expect(noteToTokenValue({
        value: '12300',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('1230');
});

test('noteToTokenValue with format', () => {
    const format = true;

    expect(noteToTokenValue({
        value: '12345',
        scalingFactor: '1',
        decimals: 0,
        format,
    })).toBe('12,345');

    expect(noteToTokenValue({
        value: '1234567890',
        scalingFactor: '100',
        decimals: 0,
        format,
    })).toBe('123,456,789,000');

    expect(noteToTokenValue({
        value: '1234567890',
        scalingFactor: '100',
        decimals: 5,
        format,
    })).toBe('1,234,567.89');
});
