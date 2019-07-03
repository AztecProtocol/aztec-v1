import { stub } from 'sinon';
import Model from '../Model';
import * as storage from '~utils/storage';

jest.mock('~utils/storage');

describe('Model', () => {
    let consoleStub;
    let errors = [];

    beforeEach(() => {
        consoleStub = stub(console, 'error');
        consoleStub.callsFake(message => errors.push(message));
    });

    afterEach(() => {
        storage.reset();
        consoleStub.restore();
        errors = [];
    });

    it('should return a new object with basic database functions', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
        });
        await carModel.set({
            id: 'ccc',
            color: 'yellow',
        });
        const savedData = await carModel.get({
            id: 'ccc',
        });
        expect(savedData).toEqual({
            color: 'yellow',
        });

        await carModel.update({
            id: 'ccc',
            color: 'blue',
        });

        const updatedData = await carModel.get({
            id: 'ccc',
        });
        expect(updatedData).toEqual({
            color: 'blue',
        });
    });

    it('only set data specified in fields', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
                'height',
            ],
        });
        await carModel.set({
            id: 'ccc',
            color: 'yellow',
            size: '100',
            height: 60,
        });
        const savedData = await carModel.get({
            id: 'ccc',
        });
        expect(savedData).toEqual({
            color: 'yellow',
            height: 60,
        });
    });

    it('use {name}:{count} as dataKey pattern by default', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
        });

        const expectedKey = 'car:0';

        const dataBefore = await storage.get(expectedKey);
        expect(dataBefore).toBeUndefined();

        await carModel.set({
            id: 'ccc',
            color: 'yellow',
        });

        const dataAfter = await storage.get(expectedKey);
        expect(dataAfter).toEqual([
            'yellow',
        ]);
    });

    it('accept custom dataKey pattern', async () => {
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
            id: 'ccc',
            color: 'yellow',
        });

        const dataAfter = await storage.get(expectedKey);
        expect(dataAfter).toEqual([
            'yellow',
        ]);
    });

    it('should use {name}Count as autoIncrementBy by default', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
        });

        const countBefore = await storage.get('carCount');
        expect(countBefore).toBeUndefined();

        await carModel.set({
            id: 'ccc',
            color: 'yellow',
        });

        const countAfter = await storage.get('carCount');
        expect(countAfter).toBe(1);
    });

    it('allow custom autoIncrementBy', async () => {
        const carModel = Model({
            name: 'car',
            fields: [
                'color',
            ],
            autoIncrementBy: 'numberOfCars',
        });

        const countBefore = await storage.get('numberOfCars');
        expect(countBefore).toBeUndefined();

        await carModel.set({
            id: 'ccc',
            color: 'yellow',
        });

        const countAfter = await storage.get('numberOfCars');
        expect(countAfter).toBe(1);

        const defaultCountAfter = await storage.get('carCount');
        expect(defaultCountAfter).toBeUndefined();
    });

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
});
