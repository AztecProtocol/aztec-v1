import getPathsFromRouteConfig from '../getPathsFromRouteConfig';

const Component = () => {};

describe('getPathsFromRouteConfig', () => {
    it('take a route config object and return urls config', () => {
        const routes = {
            _: {
                Component,
            },
            categories: {
                path: 'category',
                Component,
            },
            items: {
                path: 'item',
                Component,
                routes: {
                    save: {
                        path: 'new',
                        Component,
                    },
                    update: {
                        path: 'change',
                        routes: {
                            name: {
                                path: 'name',
                            },
                            description: {
                                path: 'desc',
                            },
                        },
                    },
                },
            },
        };
        expect(getPathsFromRouteConfig(routes)).toEqual({
            _: '/',
            categories: 'category',
            items: {
                _: 'item',
                save: 'new',
                update: {
                    _: 'change',
                    name: 'name',
                    description: 'desc',
                },
            },
        });
    });
});
