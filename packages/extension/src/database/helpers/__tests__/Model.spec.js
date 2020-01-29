import Model from '../Model';
import * as storage from '~/utils/storage';

jest.mock('~/utils/storage');

let errors = [];

const setSpy = jest.spyOn(storage, 'set');
const mockError = jest.spyOn(console, 'error')
    .mockImplementation(message => errors.push(message));

beforeEach(() => {
    storage.reset();
    setSpy.mockClear();
    mockError.mockClear();
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
            id: 'cc',
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
            id: 'cc',
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
        setSpy.mockClear();
        await carModel.set(car);
        expect(setSpy).toHaveBeenCalled();
        expect(errors.length).toBe(0);

        setSpy.mockClear();
        await carModel.set(car);
        expect(setSpy).not.toHaveBeenCalled();
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
        setSpy.mockClear();
        await carModel.set(car);
        expect(setSpy).toHaveBeenCalled();

        setSpy.mockClear();
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
        expect(setSpy).not.toHaveBeenCalled();

        expect(errors).toEqual([]);
    });

    it('can replace existing values in storage', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });

        setSpy.mockClear();
        const originalData = await carModel.set({
            id: 'cc',
            color: 'yellow',
            height: 120,
        });
        expect(setSpy).toHaveBeenCalled();
        expect(originalData).toEqual({
            data: {
                cc: {
                    color: 'yellow',
                    height: 120,
                },
            },
            storage: {
                cc: ['yellow', 120],
            },
            modified: ['cc'],
        });

        setSpy.mockClear();
        const duplicatedInfo = await carModel.set(
            {
                id: 'cc',
                color: 'red',
            },
            {
                forceReplace: true,
            },
        );
        expect(duplicatedInfo).toEqual({
            data: {
                cc: {
                    color: 'red',
                },
            },
            storage: {
                cc: ['red', -0],
            },
            modified: ['cc'],
        });
        expect(setSpy).toHaveBeenCalled();

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
            id: 'cc',
            color: 'yellow',
            height: 60,
        });

        const storageData = await storage.get('cc');
        expect(storageData).toEqual([
            'yellow',
            60,
        ]);

        expect(errors).toEqual([]);
    });
});

describe('Model with dataKey mapping', () => {
    it('allow dataKey mapping by setting a value to dataKeyPattern', async () => {
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

        const {
            key,
        } = await carModel.set({
            id: 'cc',
            color: 'yellow',
        });
        expect(key).toBe(expectedKey);
        const dataAfter = await storage.get(key);
        expect(dataAfter).toEqual([
            'yellow',
        ]);

        const savedData = await carModel.get({
            id: 'cc',
        });
        expect(savedData).toEqual({
            id: 'cc',
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

    it('can get data by key', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
            dataKeyPattern: 'c:{count}',
        });

        const id = 'cc';
        const {
            key,
        } = await carModel.set({
            id,
            color: 'yellow',
        });

        const data = await carModel.get({
            key,
        });
        expect(data).toEqual({
            color: 'yellow',
        });

        expect(errors).toEqual([]);
    });

    it('can set index to config and use it as id', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'serial',
                'color',
            ],
            index: 'serial',
            dataKeyPattern: 'c:{count}',
        });

        await carModel.set({
            serial: 'qw123',
            color: 'yellow',
        });

        const data = await carModel.get({
            key: 'c:0',
        });
        expect(data).toEqual({
            id: 'qw123',
            serial: 'qw123',
            color: 'yellow',
        });

        const dataById = await carModel.get({
            id: 'qw123',
        });
        expect(dataById).toEqual({
            id: 'qw123',
            serial: 'qw123',
            color: 'yellow',
        });

        const dataBySerial = await carModel.get({
            serial: 'qw123',
        });
        expect(dataBySerial).toEqual({
            id: 'qw123',
            serial: 'qw123',
            color: 'yellow',
        });

        expect(errors).toEqual([]);
    });

    it('return null if try to get data that is undefined in storage', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'serial',
                'color',
            ],
            dataKeyPattern: 'c:{count}',
        });
        const car = await carModel.get({
            key: 'car',
        });
        expect(car).toEqual(null);
    });
});

describe('Model with nested fields config', () => {
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
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        });

        const pikachuById = await pokemonModel.get({
            id: 'pikachu',
        });
        expect(pikachuById).toEqual({
            ...pikachu,
            id: 'pikachu',
        });

        const eevee = await pokemonModel.get({
            name: 'eevee',
        });
        expect(eevee).toEqual({
            name: 'eevee',
            color: 'brown',
            height: 80,
        });
        const eeveeById = await pokemonModel.get({
            id: 'eevee',
        });
        expect(eeveeById).toEqual({
            ...eevee,
            id: 'eevee',
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
            name: 'pikachu',
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
            name: 'pikachu',
            color: 'yellow',
            height: 80,
        });

        expect(errors).toEqual([]);
    });

    it('allow to get entire data', async () => {
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

        const pokemons = await pokemonModel.get();
        expect(pokemons).toEqual({
            pikachu: {
                name: 'pikachu',
                color: 'yellow',
                height: 60,
            },
            eevee: {
                name: 'eevee',
                color: 'brown',
                height: 80,
            },
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
            id: 'pikachu',
            name: 'pika',
            height: 60,
        });

        const secondPikachu = await pokemonModel.get({
            id: 'pikachu',
            name: 'chuchu',
        });
        expect(secondPikachu).toEqual({
            id: 'pikachu',
            name: 'chuchu',
            height: 50,
        });

        const pikachus = await pokemonModel.get({
            id: 'pikachu',
        });
        expect(pikachus).toEqual({
            pika: {
                id: 'pikachu',
                name: 'pika',
                height: 60,
            },
            chuchu: {
                id: 'pikachu',
                name: 'chuchu',
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

    it('can update object data in storage with dataKey mapping', async () => {
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
                id: 'pikachu',
                name: 'pika',
                height: 60,
            },
            chuchu: {
                id: 'pikachu',
                name: 'chuchu',
                height: 70,
            },
        });

        expect(errors).toEqual([]);
    });
});

describe('invalid constructor parameters', () => {
    it('should return null if config has missing required fields', async () => {
        const withoutName = Model({
        });
        expect(withoutName).toBe(null);
        expect(errors.pop()).toMatch(/name/);

        const withoutFields = Model({
            name: 'car',
        });
        expect(withoutFields).toBe(null);
        expect(errors.pop()).toMatch(/fields/);
    });

    it('should return null if config is of wrong type', async () => {
        const wrongRequiredTypeModel = Model({
            name: 123,
        });
        expect(wrongRequiredTypeModel).toBe(null);
        expect(errors.pop()).toMatch(/name/);

        const wrongTypeModel = Model({
            name: 'car',
            fields: [],
            autoIncrementBy: null,
        });
        expect(wrongTypeModel).toBe(null);
        expect(errors.pop()).toMatch(/autoIncrementBy/);
    });
});

describe('Model.each', () => {
    it('loop through every entry of nested model data', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'name',
                fields: [
                    'color',
                ],
            },
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'chikorita',
            color: 'green',
        });

        const collected = [];
        await pokemonModel.each((data) => {
            collected.push(data);
        });

        expect(collected).toEqual([
            {
                id: 'pikachu',
                name: 'pikachu',
                color: 'yellow',
            },
            {
                id: 'eevee',
                name: 'eevee',
                color: 'brown',
            },
            {
                id: 'chikorita',
                name: 'chikorita',
                color: 'green',
            },
        ]);

        expect(errors).toEqual([]);
    });

    it('loop through every entry of model with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            id: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'chikorita',
            color: 'green',
        });

        const collected = [];
        await pokemonModel.each((data) => {
            collected.push(data);
        });

        expect(collected).toEqual([
            {
                key: 'p:0',
                color: 'yellow',
            },
            {
                key: 'p:1',
                color: 'brown',
            },
            {
                key: 'p:2',
                color: 'green',
            },
        ]);

        expect(errors).toEqual([]);
    });

    it('loop through every entry of model with dataKey mapping and index', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'chikorita',
            color: 'green',
        });

        const collected = [];
        await pokemonModel.each((data) => {
            collected.push(data);
        });

        expect(collected).toEqual([
            {
                key: 'p:0',
                id: 'pikachu',
                name: 'pikachu',
                color: 'yellow',
            },
            {
                key: 'p:1',
                id: 'eevee',
                name: 'eevee',
                color: 'brown',
            },
            {
                key: 'p:2',
                id: 'chikorita',
                name: 'chikorita',
                color: 'green',
            },
        ]);

        expect(errors).toEqual([]);
    });

    it('loop through every entry of nested model data with min id', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'id',
                fields: [
                    'name',
                ],
            },
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
        });
        await pokemonModel.set({
            id: 'poke2',
            name: 'chikorita',
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
        });

        const collected = [];
        await pokemonModel.each(
            data => collected.push(data),
            {
                idGt: 'poke1',
            },
        );

        expect(collected).toEqual([
            {
                id: 'poke2',
                name: 'chikorita',
            },
        ]);

        expect(errors).toEqual([]);
    });

    it('loop through data with dataKey mapping and a min id', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'chikorita',
            color: 'green',
        });

        const collected = [];
        await pokemonModel.each(
            (data) => {
                collected.push(data);
            },
            {
                idGt: 'p:0',
            },
        );

        expect(collected).toEqual([
            {
                key: 'p:1',
                id: 'eevee',
                name: 'eevee',
                color: 'brown',
            },
            {
                key: 'p:2',
                id: 'chikorita',
                name: 'chikorita',
                color: 'green',
            },
        ]);

        expect(errors).toEqual([]);
    });
});

describe('Model.last', () => {
    it('find the last entry in nested model data', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'name',
                fields: [
                    'color',
                ],
            },
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last();

        expect(lastPokemon).toEqual({
            id: 'chikorita',
            name: 'chikorita',
            color: 'green',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in model data with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            id: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last();

        expect(lastPokemon).toEqual({
            key: 'p:2',
            color: 'green',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in model data with dataKey mapping and index', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last();

        expect(lastPokemon).toEqual({
            key: 'p:2',
            id: 'chikorita',
            name: 'chikorita',
            color: 'green',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in nested model data with max id', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'id',
                fields: [
                    'name',
                ],
            },
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
        });
        await pokemonModel.set({
            id: 'poke2',
            name: 'chikorita',
        });

        const lastPokemon = await pokemonModel.last({
            idLt: 'poke2',
        });

        expect(lastPokemon).toEqual({
            id: 'poke1',
            name: 'eevee',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in nested model data with required conditions', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'id',
                fields: [
                    'name',
                    'color',
                    'height',
                ],
            },
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
            color: 'brown',
            height: 55,
        });
        await pokemonModel.set({
            id: 'poke2',
            name: 'pikachu',
            color: 'yellow',
            height: 80,
        });
        await pokemonModel.set({
            id: 'poke3',
            name: 'chikorita',
            color: 'green',
            height: 60,
        });

        const lastPokemon = await pokemonModel.last({
            color: 'yellow',
            height: 60,
        });

        expect(lastPokemon).toEqual({
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
            height: 60,
        });

        expect(errors).toEqual([]);
    });

    it('return null if no entries in nested model data have the required conditions', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: {
                key: 'id',
                fields: [
                    'name',
                    'color',
                ],
            },
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'poke3',
            name: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last({
            color: 'red',
        });

        expect(lastPokemon).toBe(null);

        expect(errors).toEqual([]);
    });

    it('find the last entry in model data with dataKey mapping and max id', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            id: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last({
            idLt: 'eevee',
        });

        expect(lastPokemon).toEqual({
            key: 'p:0',
            color: 'yellow',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in model data with dataKey mapping and max key', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'pikachu',
            color: 'yellow',
        });
        await pokemonModel.set({
            id: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'chikorita',
            color: 'green',
        });

        const lastPokemon = await pokemonModel.last({
            keyLt: 'p:1',
        });

        expect(lastPokemon).toEqual({
            key: 'p:0',
            color: 'yellow',
        });

        expect(errors).toEqual([]);
    });

    it('find the last entry in model data with dataKey mapping and required conditions', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'name',
                'color',
                'height',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
            height: 50,
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
            color: 'brown',
            height: 40,
        });
        await pokemonModel.set({
            id: 'poke2',
            name: 'chikorita',
            color: 'green',
            height: 40,
        });

        const lastPokemon = await pokemonModel.last({
            color: 'brown',
            height: 40,
        });

        expect(lastPokemon).toEqual({
            key: 'p:1',
            name: 'eevee',
            color: 'brown',
            height: 40,
        });

        expect(errors).toEqual([]);
    });

    it('return null if no entries in model data with dataKey mapping have the required conditions', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'name',
                'color',
                'height',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'poke0',
            name: 'pikachu',
            color: 'yellow',
            height: 50,
        });
        await pokemonModel.set({
            id: 'poke1',
            name: 'eevee',
            color: 'brown',
            height: 40,
        });
        await pokemonModel.set({
            id: 'poke2',
            name: 'chikorita',
            color: 'green',
            height: 40,
        });

        const lastPokemon = await pokemonModel.last({
            color: 'brown',
            height: 50,
        });

        expect(lastPokemon).toBe(null);

        expect(errors).toEqual([]);
    });
});

describe('Model.keyOf', () => {
    it('get key by id in a model with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            fields: [
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            id: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            id: 'pikachu',
            color: 'yellow',
        });

        const key = await pokemonModel.keyOf({
            id: 'pikachu',
        });
        expect(key).toBe('p:1');
    });

    it('get key by index in a model with dataKey mapping', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });

        const key = await pokemonModel.keyOf({
            name: 'pikachu',
        });
        expect(key).toBe('p:1');
    });

    it('accept a string as id', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });
        await pokemonModel.set({
            name: 'pikachu',
            color: 'yellow',
        });

        const key = await pokemonModel.keyOf('pikachu');
        expect(key).toBe('p:1');
    });

    it('return empty string if key is not found', async () => {
        const pokemonModel = Model({
            name: 'pokemon',
            index: 'name',
            fields: [
                'name',
                'color',
            ],
            dataKeyPattern: 'p:{count}',
        });
        await pokemonModel.set({
            name: 'eevee',
            color: 'brown',
        });

        const key = await pokemonModel.keyOf('pikachu');
        expect(key).toBe('');
    });
});
