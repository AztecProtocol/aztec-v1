import getDomainFromUrl from '../getDomainFromUrl';

test('getDomainFromUrl', () => {
    const testDomain = (domain, expected) => {
        const expectedDomain = expected || domain;
        expect(getDomainFromUrl(`http://${domain}`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`https://${domain}`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`https://${domain}/index.html`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`https://${domain}/pages/123`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`${domain}/search`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`${domain}?id=abc`)).toBe(expectedDomain);
        expect(getDomainFromUrl(`${domain}/search?term=abc`)).toBe(expectedDomain);
    };

    testDomain('whatever.com');
    testDomain('whatever.co.uk');
    testDomain('okay.whatever.com', 'whatever.com');
    testDomain('okay.whatever.co.uk', 'whatever.co.uk');
    testDomain('localhost');
    testDomain('localhost:3000', 'localhost');
    testDomain('127.0.0.1', 'localhost');
    testDomain('127.0.0.2');
    testDomain('127.0.0.2:5000', '127.0.0.2');
    testDomain('whatever.com/localhost', 'whatever.com');
    testDomain('whatever.com/127.0.0.1', 'whatever.com');
});
