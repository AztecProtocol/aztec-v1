import { stub } from 'sinon';
import dataKey from '../dataKey';

describe('dataKey', () => {
    let consoleStub;
    let errors = [];

    beforeEach(() => {
        consoleStub = stub(console, 'error');
        consoleStub.callsFake(message => errors.push(message));
    });

    afterEach(() => {
        consoleStub.restore();
        errors = [];
    });

    it('return a key for storage using pattern defined in config/dataKey', () => {
        expect(dataKey(
            'asset',
            {
                count: 123,
            },
        )).toBe('a:123');

        expect(dataKey(
            'asset',
            {
                count: 123,
                id: 'abc',
                address: '0xqaz',

            },
        )).toBe('a:123');
    });

    it('accept custom config object', () => {
        expect(dataKey(
            'asset',
            {
                id: '123',
            },
            {
                asset: 'asset_id_{id}',
            },
        )).toBe('asset_id_123');

        expect(dataKey(
            'test',
            {
                text: 'foo',
            },
            {
                test: 'bar_{text}',
            },
        )).toBe('bar_foo');
    });

    it('accept custom config string as first parameter', () => {
        expect(dataKey(
            'item_{id}',
            {
                id: '123',
            },
        )).toBe('item_123');
    });

    it('allow multiple variables', () => {
        expect(dataKey(
            'item_{id}_{name}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc');
    });

    it('allow duplicated variables', () => {
        expect(dataKey(
            'item_{id}_{name}_{id}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc_12');
    });

    it('return empty string if pattern is not defined properly', () => {
        expect(dataKey(
            'whatever',
            {
                name: 'abc',
                whatever: 'val',
            },
        )).toBe('');
        expect(errors.length).toBe(0);
    });

    it('keep variable if key is not defined in data', () => {
        expect(dataKey(
            'asset',
            {
                name: 'abc',
            },
        )).toBe('a:{count}');
        expect(errors.length).toBe(1);

        expect(dataKey(
            'item_{id}_{name}',
            {
                name: 'abc',
            },
        )).toBe('item_{id}_abc');
        expect(errors.length).toBe(2);
    });
});
