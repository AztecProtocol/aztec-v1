const hasChangedDeep = require('../../publish/hasChangedDeep');

// Tests.
describe('hasChangedDeep()', () => {
    test('Works correctly with no deps', () => {
        expect(hasChangedDeep([])).toBe(false);
    });
    test('Works correctly with deps', () => {
        const pkgs1 = [{ _nextType: 'patch', _localDeps: [] }];
        expect(hasChangedDeep(pkgs1)).toBe(true);
        const pkgs2 = [{ _nextType: undefined, _localDeps: [] }];
        expect(hasChangedDeep(pkgs2)).toBe(false);
        const pkgs3 = [
            {
                _nextType: undefined,
                _localDeps: [{ _nextType: false, _localDeps: [] }, { _nextType: false, _localDeps: [] }],
            },
        ];
        expect(hasChangedDeep(pkgs3)).toBe(false);
        const pkgs4 = [
            {
                _nextType: undefined,
                _localDeps: [{ _nextType: 'patch', _localDeps: [] }, { _nextType: false, _localDeps: [] }],
            },
        ];
        expect(hasChangedDeep(pkgs4)).toBe(true);
        const pkgs5 = [
            {
                _nextType: undefined,
                _localDeps: [
                    {
                        _nextType: false,
                        _localDeps: [{ _nextType: false, _localDeps: [] }, { _nextType: false, _localDeps: [] }],
                    },
                ],
            },
        ];
        expect(hasChangedDeep(pkgs5)).toBe(false);
        const pkgs6 = [
            {
                _nextType: undefined,
                _localDeps: [
                    {
                        _nextType: false,
                        _localDeps: [
                            { _nextType: false, _localDeps: [] },
                            { _nextType: 'patch', _localDeps: [] },
                            { _nextType: false, _localDeps: [] },
                        ],
                    },
                ],
            },
        ];
        expect(hasChangedDeep(pkgs6)).toBe(true);
    });
    test('No infinite loops', () => {
        const pkgs1 = [{ _nextType: 'patch', _localDeps: [] }];
        pkgs1[0]._localDeps.push(pkgs1[0]);
        expect(hasChangedDeep(pkgs1)).toBe(true);
        const pkgs2 = [{ _nextType: undefined, _localDeps: [] }];
        pkgs2[0]._localDeps.push(pkgs2[0]);
        expect(hasChangedDeep(pkgs2)).toBe(false);
        const pkgs3 = [
            {
                _nextType: undefined,
                _localDeps: [{ _nextType: false, _localDeps: [] }, { _nextType: false, _localDeps: [] }],
            },
        ];
        pkgs3[0]._localDeps[0]._localDeps.push(pkgs3[0]._localDeps[0]);
        expect(hasChangedDeep(pkgs3)).toBe(false);
        const pkgs4 = [
            {
                _nextType: undefined,
                _localDeps: [{ _nextType: 'patch', _localDeps: [] }, { _nextType: false, _localDeps: [] }],
            },
        ];
        pkgs4[0]._localDeps[0]._localDeps.push(pkgs4[0]._localDeps[0]);
        expect(hasChangedDeep(pkgs4)).toBe(true);
    });
});
