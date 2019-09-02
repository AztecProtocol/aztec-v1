import cloneDeep from 'lodash/cloneDeep';
import mergeNoteValues from '../utils/mergeNoteValues';

describe('mergeNoteValues', () => {
    it('merge multiple note values objects', () => {
        const noteValues0 = {
            0: ['noteKey_0', 'noteKey_1'],
            2: ['noteKey_2'],
        };
        const noteValues1 = {
            2: ['noteKey_3', 'noteKey_4'],
            5: ['noteKey_5'],
        };
        const noteValues2 = {
            0: ['noteKey_6'],
            3: ['noteKey_7'],
        };
        const prevNoteValues0 = cloneDeep(noteValues0);
        const prevNoteValues1 = cloneDeep(noteValues1);
        const prevNoteValues2 = cloneDeep(noteValues2);

        const merged = mergeNoteValues(
            noteValues0,
            noteValues1,
            noteValues2,
        );
        expect(merged).toEqual({
            0: ['noteKey_0', 'noteKey_1', 'noteKey_6'],
            2: ['noteKey_2', 'noteKey_3', 'noteKey_4'],
            3: ['noteKey_7'],
            5: ['noteKey_5'],
        });

        expect(noteValues0).toEqual(prevNoteValues0);
        expect(noteValues1).toEqual(prevNoteValues1);
        expect(noteValues2).toEqual(prevNoteValues2);
    });

    it('will not have duplicated note keys in the same bucket', () => {
        const noteValues0 = {
            2: ['noteKey_2'],
        };
        const noteValues1 = {
            2: ['noteKey_2', 'noteKey_3'],
        };
        const merged = mergeNoteValues(noteValues0, noteValues1);
        expect(merged).toEqual({
            2: ['noteKey_2', 'noteKey_3'],
        });
    });

    it('will not break from empty input note values', () => {
        const noteValues0 = {
            2: ['noteKey_2'],
        };
        const merged = mergeNoteValues(
            {},
            noteValues0,
            null,
        );
        expect(merged).toEqual({
            2: ['noteKey_2'],
        });
    });
});
