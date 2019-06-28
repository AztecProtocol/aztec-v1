import Storage from './Storage';

describe('Storage', () => {
    let storage;
    let runStart = [];
    let runStartTimestamps = {};
    let runEnd = [];
    let runEndTimestamps = {};

    beforeEach(() => {
        storage = new Storage();
        runStart = [];
        runEnd = [];
        runStartTimestamps = {};
        runEndTimestamps = {};
    });

    const run = (name, time) => () => {
        runStart.push(name);
        runStartTimestamps[name] = Date.now();

        return new Promise((resolve) => {
            setTimeout(() => {
                runEnd.push(name);
                runEndTimestamps[name] = Date.now();
                resolve();
            }, time);
        });
    };

    const startAt = name => runStartTimestamps[name];
    const endAt = name => runEndTimestamps[name];

    it('allow to lock a function by key', async () => {
        await Promise.all([
            storage.lock('test', run('a', 100)),
            storage.lock('test', run('b', 10)),
        ]);

        expect(runStart).toEqual(['a', 'b']);
        expect(runEnd).toEqual(['a', 'b']);
        expect(startAt('b') >= endAt('a')).toBe(true);
    });

    it('will not block function with different keys', async () => {
        await Promise.all([
            storage.lock('test1', run('a', 200)),
            storage.lock('test2', run('b', 10)),
        ]);

        expect(runStart).toEqual(['a', 'b']);
        expect(runEnd).toEqual(['b', 'a']);
        expect(startAt('b') < endAt('a')).toBe(true);
    });

    it('allow to lock a function by an array of keys', async () => {
        const keys = [
            'test',
            'run',
        ];
        await Promise.all([
            storage.lock(keys, run('a', 100)),
            storage.lock(keys, run('b', 10)),
        ]);

        expect(runStart).toEqual(['a', 'b']);
        expect(runEnd).toEqual(['a', 'b']);
        expect(startAt('b') >= endAt('a')).toBe(true);
    });

    it('proceed with function that has no blocked keys', async () => {
        await Promise.all([
            storage.lock(
                'test',
                run('a', 200),
            ),
            storage.lock(
                ['foo', 'bar'],
                run('b', 10),
            ),
            storage.lock(
                ['test', 'foo'],
                run('c', 0),
            ),
            storage.lock(
                ['bar'],
                run('d', 0),
            ),
        ]);

        expect(runStart).toEqual([
            'a',
            'b',
            'd',
            'c',
        ]);
        expect(runEnd).toEqual([
            'b',
            'd',
            'a',
            'c',
        ]);
        expect(startAt('b') < endAt('a')).toBe(true);
        expect(startAt('c') >= endAt('a')).toBe(true);
        expect(startAt('d') < endAt('a')).toBe(true);
        expect(startAt('d') >= endAt('b')).toBe(true);
    });
});
