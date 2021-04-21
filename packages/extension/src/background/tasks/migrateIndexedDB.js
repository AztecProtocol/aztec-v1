import Dexie from 'dexie';
import {
    version,
    sdkSettingDbName,
} from '~/config/database';
import asyncForEach from '~/utils/asyncForEach';
import migrations from '~/background/database/migrations';

export default async function migrateIndexedDB(networkId) {
    const db = new Dexie(sdkSettingDbName);
    let table = db.migration;
    if (!table) {
        db.version(version)
            .stores({
                migration: '++id, timestamp, task, createdAt',
            });
        table = db.migration;
    }

    const sortedMigrations = await table
        .orderBy('id')
        .toArray();

    const {
        timestamp: lastTimstamp = 0,
        task: lastTask = -1,
    } = sortedMigrations[sortedMigrations.length - 1] || {};

    const allMigrations = Object.keys(migrations).map(timestamp => ({
        timestamp,
        tasks: migrations[timestamp],
    }));

    const newMigrations = allMigrations
        .filter(({ timestamp }) => timestamp >= lastTimstamp)
        .sort((a, b) => a.timestamp - b.timestamp);

    let error;
    await asyncForEach(newMigrations, async ({
        timestamp,
        tasks,
    }) => {
        if (error) return;
        await asyncForEach(tasks, async (task, i) => {
            if (error
                || (timestamp === lastTimstamp && i <= lastTask)
            ) return;

            try {
                await task(networkId);
            } catch (e) {
                error = e;
            }
            if (!error) {
                await table.add({
                    timestamp,
                    task: i,
                    createdAt: Date.now(),
                });
            }
        });
    });
}
