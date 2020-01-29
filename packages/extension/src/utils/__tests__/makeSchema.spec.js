import BN from 'bn.js';
import makeSchema from '../makeSchema';

describe('makeSchema', () => {
    it('validate args type', () => {
        const schema = makeSchema({
            name: {
                type: 'string',
            },
            age: {
                type: 'integer',
            },
            weight: {
                type: 'number',
            },
            valid: {
                type: 'boolean',
            },
            address: {
                type: 'object',
            },
            friends: {
                type: 'array',
            },
        });

        expect(schema.validate({
            name: 'Pika',
            age: 5,
            weight: 3.6,
            valid: false,
            address: {
                no: 100,
                street: 'Poke Avenue',
            },
            friends: ['Eevee'],
        })).toEqual(null);

        expect(schema.validate({
            age: 5,
            rating: new BN(10),
        })).toEqual(null);

        expect(schema.validate({
            name: 123,
        })).toMatch(/name/);

        expect(schema.validate({
            age: '5',
        })).toMatch(/age/);

        expect(schema.validate({
            age: 5.5,
        })).toMatch(/age/);

        expect(schema.validate({
            weight: '3.6',
        })).toMatch(/weight/);

        expect(schema.validate({
            valid: 'false',
        })).toMatch(/valid/);

        expect(schema.validate({
            address: 'Poke Avenue',
        })).toMatch(/address/);

        expect(schema.validate({
            friends: {
                0: 'Eevee',
            },
        })).toMatch(/friends/);
    });

    it('accept custom type', () => {
        const schema = makeSchema({
            rating: {
                type: BN,
            },
            id: {
                type: val => typeof val === 'string' || val === 0,
            },
        });

        expect(schema.validate({
            rating: new BN(10),
        })).toEqual(null);

        expect(schema.validate({
            id: 0,
        })).toEqual(null);

        expect(schema.validate({
            rating: 10,
        })).toMatch(/rating/);

        expect(schema.validate({
            id: 1,
        })).toMatch(/id/);
    });

    it('allow multiple types', () => {
        const schema = makeSchema({
            value: {
                type: ['number', BN],
            },
        });

        expect(schema.validate({
            value: 10,
        })).toBe(null);

        expect(schema.validate({
            value: 0,
        })).toBe(null);

        expect(schema.validate({
            value: Number(10),
        })).toBe(null);

        expect(schema.validate({
            value: new BN(10),
        })).toBe(null);

        expect(schema.validate({
            value: '10',
        })).toMatch(/value/);

        expect(schema.validate({
            value: '',
        })).toMatch(/value/);
    });

    it('validate nested args type', () => {
        const schema = makeSchema({
            address: {
                type: 'object',
                property: {
                    street: {
                        type: 'string',
                    },
                    country: {
                        code: {
                            type: 'number',
                        },
                        names: {
                            type: 'array',
                            each: {
                                type: 'number',
                            },
                        },
                    },
                },
            },
            friends: {
                type: 'array',
                each: {
                    type: {
                        id: {
                            type: 'number',
                        },
                        category: {
                            type: 'string',
                        },
                    },
                    nicknames: {
                        type: 'array',
                        each: {
                            type: 'string',
                        },
                    },
                    age: {
                        type: 'number',
                    },
                },
            },
        });

        expect(schema.validate({
            address: {
                street: 'Poke Avenue',
                country: {
                    code: 123,
                },
            },
            friends: [
                {
                    type: {
                        id: 100,
                        category: 'normal',
                    },
                    nicknames: ['Eevee', 'Eve'],
                    age: 8,
                },
                {
                    type: {
                        id: 200,
                        category: 'grass',
                    },
                    nicknames: ['Chikorita'],
                    age: 12,
                },
            ],
        })).toEqual(null);

        expect(schema.validate({
            address: {
                country: {
                    code: 123,
                },
            },
            friends: [
                {
                    type: {
                        category: 'normal',
                    },
                    age: 8,
                },
                {
                    nicknames: ['Chikorita'],
                },
            ],
        })).toEqual(null);

        expect(schema.validate({
            address: {
                street: 'Poke Avenue',
                country: 'Pokaland',
            },
        })).toMatch(/address.country/);

        expect(schema.validate({
            friends: [
                {
                    nicknames: ['Eevee'],
                },
                {
                    nicknames: ['Chikorita', 'Chita', 100],
                    age: 12,
                },
            ],
        })).toMatch(/friends.1.nicknames.2/);

        expect(schema.validate({
            friends: [
                {
                    type: {
                        id: 100,
                        category: 100,
                    },
                    nicknames: ['Eevee', 'Eve'],
                    age: 8,
                },
            ],
        })).toMatch(/friends.0.type.category/);
    });

    it('validate required value', () => {
        const schema = makeSchema({
            id: {
                type: 'string',
                required: true,
            },
            profile: {
                type: 'object',
                required: true,
                property: {
                    colors: {
                        type: 'array',
                        required: true,
                    },
                    size: {
                        type: 'array',
                        each: {
                            name: {
                                type: 'string',
                                required: true,
                            },
                            value: {
                                type: 'number',
                                required: true,
                            },
                        },
                    },
                },
            },
        });

        expect(schema.validate({
            id: 'abc',
            profile: {
                colors: ['red', 'blue'],
                size: [
                    {
                        name: 'width',
                        value: 20,
                    },
                    {
                        name: 'height',
                        value: 10.01,
                    },
                ],
            },
        })).toBe(null);

        expect(schema.validate({
            id: '',
            profile: {
                colors: [],
                size: [],
            },
        })).toBe(null);

        expect(schema.validate({
            profile: {
                colors: ['red', 'blue'],
                size: [
                    {
                        name: 'width',
                        value: 20,
                    },
                ],
            },
        })).toMatch(/id/);

        expect(schema.validate({
            id: 'abc',
            profile: {
                size: [
                    {
                        name: 'width',
                        value: 20,
                    },
                ],
            },
        })).toMatch(/profile.colors/);

        expect(schema.validate({
            id: 'abc',
            profile: {
                colors: ['red', 'blue'],
                size: [
                    {
                        name: 'width',
                    },
                    {
                        name: 'height',
                        value: 10.01,
                    },
                ],
            },
        })).toMatch(/profile.size.0.value/);

        expect(schema.validate({
            id: 'abc',
            profile: {
                colors: ['red', 'blue'],
                size: [
                    {
                        name: 'width',
                        value: 20,
                    },
                    {
                        value: 10.01,
                    },
                ],
            },
        })).toMatch(/profile.size.1.name/);
    });

    it('validate number value', () => {
        const schema = makeSchema({
            age: {
                adult: {
                    type: 'number',
                    size: {
                        gte: 12,
                    },
                },
                child: {
                    type: 'number',
                    size: {
                        lte: 11,
                    },
                },
                infant: {
                    type: 'number',
                    size: 0,
                },
                junior: {
                    type: 'number',
                    size: {
                        gte: 6,
                        lte: 14,
                    },
                },
            },
        });

        expect(schema.validate({
            age: {
                adult: 18,
                child: 9,
                infant: 0,
                junior: 12,
            },
        })).toBe(null);

        expect(schema.validate({
            age: {
                adult: 12,
                child: 11,
                infant: 0,
            },
        })).toBe(null);

        expect(schema.validate({
            age: {
                adult: 18,
                child: 12,
            },
        })).toMatch(/age.child/);

        expect(schema.validate({
            age: {
                adult: 11,
                child: 9,
            },
        })).toMatch(/age.adult/);

        expect(schema.validate({
            age: {
                infant: 1,
            },
        })).toMatch(/age.infant/);

        [6, 10, 14].forEach((validJuniorAge) => {
            expect(schema.validate({
                age: {
                    junior: validJuniorAge,
                },
            })).toBe(null);
        });

        [5, 15].forEach((invalidJuniorAge) => {
            expect(schema.validate({
                age: {
                    junior: invalidJuniorAge,
                },
            })).toMatch(/age.junior/);
        });
    });

    it('validate array size', () => {
        const schema = makeSchema({
            ids: {
                type: 'array',
                size: 2,
            },
            names: {
                type: 'array',
                size: {
                    gte: 1,
                    lte: 2,
                },
            },
            categories: {
                type: 'array',
                each: {
                    id: {
                        type: 'string',
                        required: true,
                    },
                    name: {
                        type: 'string',
                    },
                },
                size: {
                    gt: 0,
                    lt: 3,
                },
            },
        });

        expect(schema.validate({
            ids: ['100', '200'],
        })).toBe(null);

        expect(schema.validate({
            ids: ['100'],
        })).toMatch(/ids/);

        expect(schema.validate({
            ids: ['100', '200', '300'],
        })).toMatch(/ids/);

        expect(schema.validate({
            names: ['a'],
        })).toBe(null);

        expect(schema.validate({
            names: ['a', 'b'],
        })).toBe(null);

        expect(schema.validate({
            names: null,
        })).toBe(null);

        expect(schema.validate({
            names: [],
        })).toMatch(/names/);

        expect(schema.validate({
            names: ['a', 'b', 'c'],
        })).toMatch(/names/);

        expect(schema.validate({
            categories: [
                { id: '123' },
            ],
        })).toBe(null);

        expect(schema.validate({
            categories: [],
        })).toMatch(/categories/);

        expect(schema.validate({
            categories: [
                { id: '1' },
                { id: '2' },
                { id: '3' },
            ],
        })).toMatch(/categories/);

        expect(schema.validate({
            categories: [
                { name: 'category with no id' },
                { id: '2' },
                { id: '3' },
            ],
        })).toMatch(/categories.+expected size/);
    });

    it('validate string length', () => {
        const schema = makeSchema({
            profile: {
                id: {
                    type: 'string',
                    length: 4,
                },
                name: {
                    type: 'string',
                    length: {
                        gte: 2,
                        lte: 5,
                    },
                },
            },
        });

        expect(schema.validate({
            profile: {
                id: 'aaaa',
                name: 'dodo',
            },
        })).toBe(null);

        [
            '',
            'a',
            'aa',
            'aaa',
            'aaaaa',
        ].forEach((invalidId) => {
            expect(schema.validate({
                profile: {
                    id: invalidId,
                },
            })).toMatch(/profile.id/);
        });

        [
            '',
            'a',
            'aaaaaa',
        ].forEach((invalidName) => {
            expect(schema.validate({
                profile: {
                    name: invalidName,
                },
            })).toMatch(/profile.name/);
        });
    });

    it('validate string pattern', () => {
        const schema = makeSchema({
            profile: {
                id: {
                    type: 'string',
                    match: /^0x[0-9]{4,}$/,
                },
            },
        });

        expect(schema.validate({
            profile: {
                id: '0x1234',
            },
        })).toBe(null);

        [
            '',
            '0x',
            '012345',
            '0xabcd',
        ].forEach((invalidId) => {
            expect(schema.validate({
                profile: {
                    id: invalidId,
                },
            })).toMatch(/profile.id/);
        });
    });

    it('acccept custom compare function', () => {
        const schema = makeSchema({
            oct: {
                type: ['string', 'number'],
                size: {
                    gt: '3',
                    lt: 77,
                    comp: (val, targetValue) => {
                        const diff = parseInt(val, 8) - parseInt(targetValue, 8);
                        if (diff === 0) {
                            return diff;
                        }
                        return diff > 0 ? 1 : -1;
                    },
                },
            },
            hex: {
                type: ['string', 'number'],
                size: {
                    gte: 4,
                    lte: '1c',
                    comp: (val, targetValue) => {
                        const diff = parseInt(val, 16) - parseInt(targetValue, 16);
                        if (diff === 0) {
                            return diff;
                        }
                        return diff > 0 ? 1 : -1;
                    },
                },
            },
        });

        [
            4,
            '5',
            75,
            '76',
        ].forEach((validOct) => {
            expect(schema.validate({
                oct: validOct,
            })).toBe(null);
        });

        [
            2,
            '3',
            77,
            '80',
        ].forEach((invalidOct) => {
            expect(schema.validate({
                oct: invalidOct,
            })).toMatch(/oct/);
        });

        [
            4,
            '5',
            '1c',
        ].forEach((validHex) => {
            expect(schema.validate({
                hex: validHex,
            })).toBe(null);
        });

        [
            2,
            '3',
            '1d',
            20,
            'ab',
        ].forEach((invalidHex) => {
            expect(schema.validate({
                hex: invalidHex,
            })).toMatch(/hex/);
        });
    });
});
