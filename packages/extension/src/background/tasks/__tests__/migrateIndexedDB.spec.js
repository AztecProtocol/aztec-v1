/* eslint-disable no-console */
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {
    mockMigrations,
} from '~/background/database/migrations';
import {
    sdkSettingDbName,
} from '~/config/database';
import deleteAllDBs from '~/background/database/utils/deleteAllDBs';
import migrateIndexedDB from '../migrateIndexedDB';

jest.mock('~/background/database/migrations');

jest.spyOn(Dexie, 'getDatabaseNames')
    .mockImplementation(() => ([
        sdkSettingDbName,
    ]));

describe('migrateIndexedDB', () => {
    let logs = [];
    const consoleSpy = jest.spyOn(console, 'log')
        .mockImplementation(message => logs.push(message));

    beforeEach(async () => {
        logs = [];
        consoleSpy.mockClear();

        await deleteAllDBs();
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    it('take configs and run tasks in it', async () => {
        mockMigrations({
            1: [
                () => console.log('a'),
                () => console.log('b'),
                () => console.log('c'),
            ],
        });

        await migrateIndexedDB();

        expect(logs).toEqual([
            'a',
            'b',
            'c',
        ]);
    });

    it('run migrations in ascending order of their keys', async () => {
        mockMigrations({
            2: [
                () => console.log('a2'),
                () => console.log('b2'),
            ],
            1: [
                () => console.log('a1'),
                () => console.log('b1'),
            ],
            3: [
                () => console.log('a3'),
                () => console.log('b3'),
            ],
        });

        await migrateIndexedDB();

        expect(logs).toEqual([
            'a1',
            'b1',
            'a2',
            'b2',
            'a3',
            'b3',
        ]);
    });

    it('will not run previous migrations', async () => {
        mockMigrations({
            1: [
                () => console.log('a1'),
                () => console.log('b1'),
            ],
        });

        await migrateIndexedDB();

        expect(logs).toEqual([
            'a1',
            'b1',
        ]);

        mockMigrations({
            1: [
                () => console.log('a1'),
                () => console.log('b1'),
            ],
            2: [
                () => console.log('a2'),
                () => console.log('b2'),
            ],
        });

        logs = [];

        await migrateIndexedDB();

        expect(logs).toEqual([
            'a2',
            'b2',
        ]);

        mockMigrations({
            3: [
                () => console.log('a3'),
                () => console.log('b3'),
            ],
            1: [
                () => console.log('a1'),
                () => console.log('b1'),
            ],
            2: [
                () => console.log('a2'),
                () => console.log('b2'),
                () => console.log('c2'),
            ],
        });

        logs = [];

        await migrateIndexedDB();

        expect(logs).toEqual([
            'c2',
            'a3',
            'b3',
        ]);
    });
});
