import LRU from '~/utils/caches/LRU';

describe('LRU', () => {
    let cache;

    beforeEach(() => {
        cache = new LRU(3);
    });

    it('remove least recently used item first', () => {
        cache.add('a', 1);
        cache.add('b', 2);
        cache.add('c', 3);
        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);

        cache.add('d', 4);
        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
        expect(cache.get('d')).toBe(4);

        cache.add('b', 2);
        cache.add('e', 5);
        expect(cache.get('b')).toBe(2);
        expect(cache.get('e')).toBe(5);
        expect(cache.get('c')).toBeUndefined();
    });
});
