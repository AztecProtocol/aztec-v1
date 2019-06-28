import { stub } from 'sinon';
import dataToKey from './dataToKey';

describe('dataToKey', () => {
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
        expect(dataToKey(
            'asset',
            {
                count: 123,
            },
        )).toBe('a:123');

        expect(dataToKey(
            'asset',
            {
                count: 123,
                id: 'abc',
                address: '0xqaz',

            },
        )).toBe('a:123');
    });

    it('accept custom config object', () => {
        expect(dataToKey(
            'asset',
            {
                id: '123',
            },
            {
                asset: 'asset_id_{id}',
            },
        )).toBe('asset_id_123');

        expect(dataToKey(
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
        expect(dataToKey(
            'item_{id}',
            {
                id: '123',
            },
        )).toBe('item_123');
    });

    it('allow multiple variables', () => {
        expect(dataToKey(
            'item_{id}_{name}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc');
    });

    it('allow duplicated variables', () => {
        expect(dataToKey(
            'item_{id}_{name}_{id}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc_12');
    });

    it('keep variable if key is not defined in data', () => {
        expect(dataToKey(
            'asset',
            {
                name: 'abc',
            },
        )).toBe('a:{count}');
        expect(errors.length).toBe(1);

        expect(dataToKey(
            'item_{id}_{name}',
            {
                name: 'abc',
            },
        )).toBe('item_{id}_abc');
        expect(errors.length).toBe(2);
    });
});
