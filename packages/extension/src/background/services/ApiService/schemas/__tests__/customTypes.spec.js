import BN from 'bn.js';
import makeSchema from '~/utils/makeSchema';
import bigNumberType from '../types/bigNumber';

describe('bigNumber type', () => {
    it('validate if value can to used in bn.js\'s constructor', () => {
        const bnSchema = makeSchema({
            value: bigNumberType,
        });

        expect(bnSchema.validate({
            value: 10,
        })).toBe(null);

        expect(bnSchema.validate({
            value: 0,
        })).toBe(null);

        expect(bnSchema.validate({
            value: new BN('10'),
        })).toBe(null);

        expect(bnSchema.validate({
            value: '10',
        })).toBe(null);

        expect(bnSchema.validate({
            value: 'a2',
        })).toMatch(/value/);
    });

    it('validate exact value size', () => {
        const bnSchema = makeSchema({
            value: bigNumberType.withSize(2),
        });

        expect(bnSchema.validate({
            value: 2,
        })).toBe(null);

        expect(bnSchema.validate({
            value: '2',
        })).toBe(null);

        expect(bnSchema.validate({
            value: new BN('2'),
        })).toBe(null);

        expect(bnSchema.validate({
            value: 3,
        })).toMatch(/value/);
    });

    it('validate value size', () => {
        const bnSchema = makeSchema({
            value: bigNumberType.withSize({
                gt: 3,
                lte: 10,
            }),
        });

        [
            4,
            5,
            new BN(6),
            new BN('7'),
            '8',
            9,
            10,
        ].forEach((validValue) => {
            expect(bnSchema.validate({
                value: validValue,
            })).toBe(null);
        });

        [
            0,
            '1',
            new BN(2),
            new BN('3'),
            11,
            12,
        ].forEach((invalidValue) => {
            expect(bnSchema.validate({
                value: invalidValue,
            })).toMatch(/value/);
        });
    });

    it('can be required', () => {
        const bnSchema = makeSchema({
            id: bigNumberType.isRequired,
            item: {
                name: {
                    type: 'string',
                },
                price: bigNumberType
                    .withSize({
                        gt: 0,
                    })
                    .isRequired,
                discount: bigNumberType,
            },
        });

        expect(bnSchema.validate({
            id: 2,
            item: {
                name: 'jellybean',
                price: 30,
                discount: 24,
            },
        })).toBe(null);

        expect(bnSchema.validate({
            id: 2,
            item: {
                name: 'jellybean',
                price: 30,
            },
        })).toBe(null);

        expect(bnSchema.validate({
            id: 2,
            item: {
                name: 'jellybean',
            },
        })).toMatch(/item.price/);

        expect(bnSchema.validate({
            item: {
                name: 'jellybean',
                price: 30,
            },
        })).toMatch(/id/);
    });
});
