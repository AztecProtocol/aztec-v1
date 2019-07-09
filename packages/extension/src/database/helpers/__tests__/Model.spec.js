import {
    stub,
    spy,
} from 'sinon';
import Model from '../Model';
import * as storage from '~utils/storage';

jest.mock('~utils/storage');

let consoleStub;
let errors = [];
let set;

beforeEach(() => {
    consoleStub = stub(console, 'error');
    consoleStub.callsFake(message => errors.push(message));
    set = spy(storage, 'set');
});

afterEach(() => {
    storage.reset();
    consoleStub.restore();
    set.restore();
    errors = [];
});

describe('Model', () => {
    it('should return an object with basic database functions', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
        });

        await carModel.set({
            id: 'cc',
            color: 'yellow',
        });

        const savedData = await carModel.get({
            id: 'cc',
        });
        expect(savedData).toEqual({
            color: 'yellow',
        });

        await carModel.update({
            id: 'cc',
            color: 'blue',
        });

        const updatedData = await carModel.get({
            id: 'cc',
        });
        expect(updatedData).toEqual({
            color: 'blue',
        });

        expect(errors).toEqual([]);
    });

    it('should save an object as array in storage', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });

        const saveInfo = await carModel.set({
            id: 'cc',
            color: 'yellow',
            height: 120,
        });
        expect(saveInfo).toEqual({
            data: {
                cc: {
                    color: 'yellow',
                    height: 120,
                },
            },
            storage: {
                cc: [
                    'yellow',
                    120,
                ],
            },
            modified: ['cc'],
        });

        const storageData = await storage.get('cc');
        expect(storageData).toEqual([
            'yellow',
            120,
        ]);

        expect(errors).toEqual([]);
    });

    it('should log error when trying to set an existing data', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });

        const car = {
            id: 'cc',
            color: 'yellow',
            height: 120,
        };
        await carModel.set(car);
        const firstCallCount = set.callCount;
        expect(firstCallCount > 0).toBe(true);
        expect(errors.length).toBe(0);

        await carModel.set(car);
        const secondCallCount = set.callCount;
        expect(secondCallCount === firstCallCount).toBe(true);
        expect(errors.length).toBe(1);
    });

    it('can ignore error and return stored values while setting existing data', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });

        const car = {
            id: 'cc',
            color: 'yellow',
            height: 120,
        };
        await carModel.set(car);
        const firstCallCount = set.callCount;
        expect(firstCallCount > 0).toBe(true);

        const duplicatedInfo = await carModel.set(
            car,
            {
                ignoreDuplicate: true,
            },
        );
        expect(duplicatedInfo).toEqual({
            data: {
                cc: {
                    color: 'yellow',
                    height: 120,
                },
            },
            storage: {
                cc: ['yellow', 120],
            },
            modified: [],
        });
        const secondCallCount = set.callCount;
        expect(secondCallCount === firstCallCount).toBe(true);

        expect(errors).toEqual([]);
    });

    it('only save data specified in fields', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });
        await carModel.set({
            id: 'cc',
            color: 'yellow',
            size: '100',
            height: 60,
        });
        const savedData = await carModel.get({
            id: 'cc',
        });
        expect(savedData).toEqual({
            color: 'yellow',
            height: 60,
        });

        expect(errors).toEqual([]);
    });

    it('allow dataKey mapping', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
            dataKeyPattern: 'c:{color}:{count}',
        });

        const expectedKey = 'c:yellow:0';

        const dataBefore = await storage.get(expectedKey);
        expect(dataBefore).toBeUndefined();

        await carModel.set({
            id: 'cc',
            color: 'yellow',
        });

        const dataAfter = await storage.get(expectedKey);
        expect(dataAfter).toEqual([
            'yellow',
        ]);

        const savedData = await carModel.get({
            id: 'cc',
        });
        expect(savedData).toEqual({
            color: 'yellow',
        });

        expect(errors).toEqual([]);
    });

    it('should use {name}Count as autoIncrementBy by default', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
            dataKeyPattern: 'c:{count}',
        });

        const countBefore = await storage.get('carCount');
        expect(countBefore).toBeUndefined();

        await carModel.set({
            id: 'cc',
            color: 'yellow',
        });

        const countAfter = await storage.get('carCount');
        expect(countAfter).toBe(1);

        expect(errors).toEqual([]);
    });

    it('allow custom autoIncrementBy', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
            dataKeyPattern: 'c:{count}',
            autoIncrementBy: 'numberOfCars',
        });

        const countBefore = await storage.get('numberOfCars');
        expect(countBefore).toBeUndefined();

        await carModel.set({
            id: 'cc',
            color: 'yellow',
        });

        const countAfter = await storage.get('numberOfCars');
        expect(countAfter).toBe(1);

        const defaultCountAfter = await storage.get('carCount');
        expect(defaultCountAfter).toBeUndefined();

        expect(errors).toEqual([]);
    });
});

describe('Model with fields object', () => {
    it('allow to set data as an object', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'name',
                fields: [
                    'color',
                    'height',
                ],
            },
        });

        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        });

        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
            height: 80,
        });

        const pikachu = await pokemonModel.get({
            name: 'pikachu',
        });
        expect(pikachu).toEqual({
            color: 'yellow',
            height: 60,
        });

        const eevee = await pokemonModel.get({
            name: 'eevee',
        });
        expect(eevee).toEqual({
            color: 'brown',
            height: 80,
        });

        const storageData = await storage.get('pokemon');
        expect(storageData).toEqual({
            pikachu: ['yellow', 60],
            eevee: ['brown', 80],
        });

        expect(errors).toEqual([]);
    });

    it('can update an item in object data', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'name',
                fields: [
                    'color',
                    'height',
                ],
            },
        });

        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        });

        const pikachu = await pokemonModel.get({
            name: 'pikachu',
        });
        expect(pikachu).toEqual({
            color: 'yellow',
            height: 60,
        });

        await pokemonModel.update({
            name: 'pikachu',
            height: 80,
        });

        const grownUpPikachu = await pokemonModel.get({
            name: 'pikachu',
        });
        expect(grownUpPikachu).toEqual({
            color: 'yellow',
            height: 80,
        });

        expect(errors).toEqual([]);
    });

    it('can work with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            dataKeyPattern: 'p:{count}',
            fields: {
                key: 'name',
                fields: [
                    'height',
                ],
            },
        });

        await pokemonModel.set({
            id: 'pikachu',
            name: 'pika',
            height: 60,
        });

        await pokemonModel.set({
            id: 'pikachu',
            name: 'chuchu',
            height: 50,
        });

        const firstPikachu = await pokemonModel.get({
            id: 'pikachu',
            name: 'pika',
        });
        expect(firstPikachu).toEqual({
            height: 60,
        });

        const secondPikachu = await pokemonModel.get({
            id: 'pikachu',
            name: 'chuchu',
        });
        expect(secondPikachu).toEqual({
            height: 50,
        });

        const pikachus = await pokemonModel.get({
            id: 'pikachu',
        });
        expect(pikachus).toEqual({
            pika: {
                height: 60,
            },
            chuchu: {
                height: 50,
            },
        });

        const key = await storage.get('pikachu');
        expect(key).toEqual('p:0');

        const storageData = await storage.get(key);
        expect(storageData).toEqual({
            pika: [60],
            chuchu: [50],
        });

        expect(errors).toEqual([]);
    });

    it('can object data in storage with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            dataKeyPattern: 'p:{count}',
            fields: {
                key: 'name',
                fields: [
                    'height',
                ],
            },
        });

        await pokemonModel.set({
            id: 'pikachu',
            name: 'pika',
            height: 60,
        });

        await pokemonModel.set({
            id: 'pikachu',
            name: 'chuchu',
            height: 50,
        });

        await pokemonModel.update({
            id: 'pikachu',
            name: 'chuchu',
            height: 70,
        });

        const pikachus = await pokemonModel.get({
            id: 'pikachu',
        });
        expect(pikachus).toEqual({
            pika: {
                height: 60,
            },
            chuchu: {
                height: 70,
            },
        });

        expect(errors).toEqual([]);
    });
});

describe('invalid constructor parameters', () => {
    it('should return an empty object if config has missing required fields', async () => {
        const withoutName = Model({
        });
        expect(withoutName).toEqual({});
        expect(errors.pop()).toMatch(/name/);

        const withoutFields = Model({
            name: 'car',
        });
        expect(withoutFields).toEqual({});
        expect(errors.pop()).toMatch(/fields/);
    });

    it('should return an empty object if config is of wrong type', async () => {
        const wrongRequiredTypeModel = Model({
            name: 123,
        });
        expect(wrongRequiredTypeModel).toEqual({});
        expect(errors.pop()).toMatch(/name/);

        const wrongTypeModel = Model({
            name: 'car',
            fields: [],
            autoIncrementBy: null,
        });
        expect(wrongTypeModel).toEqual({});
        expect(errors.pop()).toMatch(/autoIncrementBy/);
    });
});
