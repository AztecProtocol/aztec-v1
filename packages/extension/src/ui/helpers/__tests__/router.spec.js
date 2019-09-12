import router from '../router';

let warnings = [];
const warnSpy = jest.spyOn(console, 'warn')
    .mockImplementation(message => warnings.push(message));

beforeEach(() => {
    warnings = [];
    warnSpy.mockClear();
    router.reset();
});

describe('router', () => {
    it('register an urls object', () => {
        const testUrls = {
            testKey: 'testValue',
        };
        expect(router.has('testKey')).toBe(false);

        router.register(testUrls);
        expect(router.has('testKey')).toBe(true);
    });

    it('replace previous value with newly registerd ones', () => {
        router.register({
            testKey: 'testValue',
        });
        expect(router.u('testKey')).toBe('/testValue');

        router.register({
            testKey: 'newTestValue',
        });
        expect(router.u('testKey')).toBe('/newTestValue');
    });

    it('return root url for invalid key', () => {
        const key = 'fakeKey';
        expect(router.has(key)).toBe(false);
        expect(router.u(key)).toBe('/');
        expect(warnings[0]).toMatch(/Missing url/);
    });

    it('accept a nested object with default key "_" and child values', () => {
        const testUrls = {
            testKey: {
                _: 'rootValue',
                child: 'childValue',
            },
        };
        router.register(testUrls);
        expect(router.u('testKey.child')).toBe('/rootValue/childValue');
    });

    it('apply default value to all of its siblings and children', () => {
        const testUrls = {
            testKey: {
                _: 'rootValue',
                child: {
                    url: 'child',
                    child: {
                        url: 'grandchild',
                    },
                },
            },
        };
        router.register(testUrls);
        expect(router.u('testKey.child.url')).toBe('/rootValue/child');
        expect(router.u('testKey.child.child.url')).toBe('/rootValue/grandchild');
    });

    it('apply default values from each level', () => {
        const testUrls = {
            testKey: {
                _: 'rootValue',
                child: {
                    _: 'child',
                    a: 'a',
                    child: {
                        _: 'child',
                        b: 'b',
                    },
                },
            },
        };
        router.register(testUrls);
        expect(router.u('testKey.child')).toBe('/rootValue/child');
        expect(router.u('testKey.child.a')).toBe('/rootValue/child/a');
        expect(router.u('testKey.child.child.b')).toBe('/rootValue/child/child/b');
    });

    it('accept a nested object with no default values', () => {
        const testUrls = {
            orphanKey: {
                child: 'childValue',
            },
        };
        router.register(testUrls);
        expect(router.u('orphanKey.child')).toBe('/childValue');
        expect(router.u('orphanKey')).toBe('/');
    });

    it('return url with no trailing slash if the url contains query string', () => {
        const testUrls = {
            testKey: 'testValue?query=string',
        };
        router.register(testUrls);
        expect(router.u('testKey')).toBe('/testValue?query=string');
    });

    it('set variables in url if valid options are provided', () => {
        const testUrls = {
            testKey: 'testValue?query=%{query}&term=%{term}',
        };
        router.register(testUrls);
        expect(router.u('testKey')).toBe('/testValue?query=%{query}&term=%{term}');

        const options = { term: 'testTerm', query: 'testQuery' };
        expect(router.u('testKey', options)).toBe('/testValue?query=testQuery&term=testTerm');
    });

    it('return full url without prepending its parent', () => {
        const http = 'http://test.com';
        const https = 'https://test.com';
        const mailto = 'mailto:mymail.com';
        const testUrls = {
            testKey: {
                _: 'parent',
                fullUrl: {
                    _: 'testUrl',
                    http,
                    https,
                    mailto,
                },
            },
        };
        router.register(testUrls);
        expect(router.u('testKey.fullUrl.http')).toBe(http);
        expect(router.u('testKey.fullUrl.https')).toBe(https);
        expect(router.u('testKey.fullUrl.mailto')).toBe(mailto);
    });
});
