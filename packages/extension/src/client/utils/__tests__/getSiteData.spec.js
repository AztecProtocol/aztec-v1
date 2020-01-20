import getAbsoluteIconUrl from '../getSiteData/getAbsoluteIconUrl';

describe('getAbsoluteIconUrl', () => {
    it('return icon href if it is a complete url', () => {
        expect(getAbsoluteIconUrl('http://test.com/icon.png')).toBe('http://test.com/icon.png');
        expect(getAbsoluteIconUrl('https://test.com/icon.png')).toBe('https://test.com/icon.png');
    });

    it('concat origin and path with icon href', () => {
        const location = {
            origin: 'http://test.com',
            pathname: '/',
        };
        expect(getAbsoluteIconUrl('icons/icon.png', location))
            .toBe('http://test.com/icons/icon.png');
        expect(getAbsoluteIconUrl('/icons/icon.png', location))
            .toBe('http://test.com/icons/icon.png');

        const locationWithPath = {
            origin: 'http://test.com',
            pathname: '/category/123/',
        };
        expect(getAbsoluteIconUrl('icons/icon.png', locationWithPath))
            .toBe('http://test.com/category/123/icons/icon.png');
        expect(getAbsoluteIconUrl('/icons/icon.png', locationWithPath))
            .toBe('http://test.com/category/123/icons/icon.png');
    });

    it('can process relative paths', () => {
        const locationWithPath = {
            origin: 'http://test.com',
            pathname: '/category/123/',
        };
        expect(getAbsoluteIconUrl('./icons/icon.png', locationWithPath))
            .toBe('http://test.com/category/123/icons/icon.png');
        expect(getAbsoluteIconUrl('../icons/icon.png', locationWithPath))
            .toBe('http://test.com/category/icons/icon.png');
        expect(getAbsoluteIconUrl('../../icons/icon.png', locationWithPath))
            .toBe('http://test.com/icons/icon.png');
    });
});
