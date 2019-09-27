import CacheManager from '../../caches/helpers/CacheManager';

describe('CacheManager', () => {
    const capacity = 3;
    let manager;

    beforeEach(() => {
        manager = new CacheManager(capacity);
    });

    it('add items to queue without exceeding capacity', () => {
        expect(manager.priorityQueue.length).toBe(0);
        expect(manager.cache).toEqual({});

        manager.add('a', 1);
        manager.add('b', 2);
        manager.add('c', 3);
        expect(manager.priorityQueue.length).toBe(3);
        expect(manager.cache).toEqual({
            a: 1,
            b: 2,
            c: 3,
        });
        expect(manager.get('a')).toBe(1);
        expect(manager.get('b')).toBe(2);
        expect(manager.get('c')).toBe(3);

        manager.add('d', 4);
        expect(manager.priorityQueue.length).toBe(3);
        expect(manager.cache).toEqual({
            b: 2,
            c: 3,
            d: 4,
        });
        expect(manager.get('a')).toBeUndefined();
        expect(manager.get('b')).toBe(2);
        expect(manager.get('d')).toBe(4);

        manager.add('b', 0);
        expect(manager.priorityQueue.length).toBe(3);
        expect(manager.cache).toEqual({
            b: 0,
            c: 3,
            d: 4,
        });
        expect(manager.get('b')).toBe(0);
    });

    it('add undefined value will remove the key', () => {
        manager.add('a', 1);
        manager.add('b', 2);
        expect(manager.priorityQueue.length).toBe(2);
        expect(manager.cache).toEqual({
            a: 1,
            b: 2,
        });

        manager.add('a', undefined);
        expect(manager.priorityQueue.length).toBe(1);
        expect(manager.cache).toEqual({
            b: 2,
        });
    });

    it('allow to remove items from queue', () => {
        expect(manager.priorityQueue).toEqual([]);
        expect(manager.cache).toEqual({});

        manager.add('a', 1);
        manager.add('b', 2);
        expect(manager.priorityQueue.length).toBe(2);
        expect(manager.cache).toEqual({
            a: 1,
            b: 2,
        });

        manager.remove('a');
        expect(manager.priorityQueue.length).toBe(1);
        expect(manager.cache).toEqual({
            b: 2,
        });

        manager.remove('a');
        expect(manager.priorityQueue.length).toBe(1);
        expect(manager.cache).toEqual({
            b: 2,
        });

        manager.remove('b');
        expect(manager.priorityQueue.length).toBe(0);
        expect(manager.cache).toEqual({});

        manager.remove('a');
        expect(manager.priorityQueue.length).toBe(0);
        expect(manager.cache).toEqual({});
    });

    it('increase priority of an item', () => {
        manager.add('a', 1);
        manager.add('b', 2);
        expect(manager.priorityQueue).toEqual(['a', 'b']);

        manager.increasePriority('a');
        expect(manager.priorityQueue).toEqual(['b', 'a']);

        manager.add('c', 3);
        expect(manager.priorityQueue).toEqual(['b', 'a', 'c']);

        manager.increasePriority('a');
        expect(manager.priorityQueue).toEqual(['b', 'c', 'a']);
    });

    it('has method getTop to return the key with the higest priority', () => {
        manager.add('a', 1);
        manager.add('b', 2);
        expect(manager.getTop()).toBe('b');

        manager.remove('b');
        expect(manager.getTop()).toBe('a');

        manager.add('c', 3);
        expect(manager.getTop()).toBe('c');

        manager.increasePriority('a');
        expect(manager.getTop()).toBe('a');
    });

    it('move an item to higest priority', () => {
        manager.add('a', 1);
        manager.add('b', 2);
        manager.add('c', 3);
        expect(manager.getTop()).toBe('c');

        manager.highestPriority('a');
        expect(manager.getTop()).toBe('a');

        manager.highestPriority('c');
        expect(manager.getTop()).toBe('c');
    });
});
