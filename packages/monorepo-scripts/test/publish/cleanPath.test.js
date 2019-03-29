const cleanPath = require('../../publish/cleanPath');

// Tests.
describe('cleanPath()', () => {
    test('Relative without CWD', () => {
        expect(cleanPath('aaa')).toBe(`${process.cwd()}/aaa`);
        expect(cleanPath('aaa/')).toBe(`${process.cwd()}/aaa`);
    });
    test('Relative with CWD', () => {
        expect(cleanPath('ccc', '/a/b/')).toBe(`/a/b/ccc`);
        expect(cleanPath('ccc', '/a/b')).toBe(`/a/b/ccc`);
    });
    test('Absolute without CWD', () => {
        expect(cleanPath('/aaa')).toBe(`/aaa`);
        expect(cleanPath('/aaa/')).toBe(`/aaa`);
        expect(cleanPath('/a/b/c')).toBe(`/a/b/c`);
        expect(cleanPath('/a/b/c/')).toBe(`/a/b/c`);
    });
    test('Absolute with CWD', () => {
        expect(cleanPath('/aaa', '/x/y/z')).toBe(`/aaa`);
        expect(cleanPath('/aaa/', '/x/y/z')).toBe(`/aaa`);
        expect(cleanPath('/a/b/c', '/x/y/z')).toBe(`/a/b/c`);
        expect(cleanPath('/a/b/c/', '/x/y/z')).toBe(`/a/b/c`);
    });
});
