import {
    tokenToNoteValue,
} from '../transformData';

test('tokenToNoteValue with interger value', () => {
    expect(tokenToNoteValue({
        value: '123',
        scalingFactor: '1',
        decimals: 0,
    })).toBe('123');

    expect(tokenToNoteValue({
        value: '123000',
        scalingFactor: '100',
        decimals: 0,
    })).toBe('1230');
});

test('tokenToNoteValue with decimals', () => {
    expect(tokenToNoteValue({
        value: '12.3',
        scalingFactor: '1',
        decimals: 1,
    })).toBe('123');

    expect(tokenToNoteValue({
        value: '12.3',
        scalingFactor: '1',
        decimals: 4,
    })).toBe('123000');

    expect(tokenToNoteValue({
        value: '12.3',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('123');

    expect(tokenToNoteValue({
        value: '12.300',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('123');

    expect(tokenToNoteValue({
        value: '123',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('1230');
});

test('tokenToNoteValue with overflowing value', () => {
    expect(tokenToNoteValue({
        value: '12.345',
        scalingFactor: '1',
        decimals: 2,
    })).toBe('1234');

    expect(tokenToNoteValue({
        value: '12.345',
        scalingFactor: '100',
        decimals: 3,
    })).toBe('123');

    expect(tokenToNoteValue({
        value: '1',
        scalingFactor: '2',
        decimals: 0,
    })).toBe('0');
});
