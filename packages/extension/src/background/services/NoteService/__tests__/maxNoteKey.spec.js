import dataKey from '~utils/dataKey';
import maxNoteKey from '../utils/maxNoteKey';

describe('maxNoteKey', () => {
    const noteKeys = [
        dataKey('note', { count: 0 }),
        dataKey('note', { count: 1 }),
        dataKey('note', { count: 12 }),
        dataKey('note', { count: 2 }),
        dataKey('note', { count: 9 }),
    ];

    const expectedMaxKey = dataKey('note', { count: 12 });

    it('select the maximum note key among all inputs keys', () => {
        const maxKey = maxNoteKey(...noteKeys);
        expect(maxKey).toBe(expectedMaxKey);
    });

    it('can take an array of note keys', () => {
        const maxKey = maxNoteKey(noteKeys);
        expect(maxKey).toBe(expectedMaxKey);
    });

    it('ignore invalid input keys', () => {
        const maxKey = maxNoteKey('', [null, noteKeys[2], '']);
        expect(maxKey).toBe(noteKeys[2]);
    });

    it('return empty string if there is no valid input key', () => {
        const maxKey = maxNoteKey('', null);
        expect(maxKey).toBe('');
    });
});
