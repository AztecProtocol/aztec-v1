import asyncForEach from '~/utils/asyncForEach';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiPermissionService from '~/client/services/ApiPermissionService';
import ApiManager from '../ApiManager';

jest.spyOn(ConnectionService, 'init')
    .mockImplementation(jest.fn());

let manager;

beforeEach(() => {
    manager = new ApiManager();
});

describe('ApiManager listeners', () => {
    it('has an event listener for account and network changes', () => {
        const listener = jest.fn();
        manager.eventListeners.add('profileChanged', listener);

        expect(listener).toHaveBeenCalledTimes(0);

        const address = 'account_address';
        Web3Service.eventListeners.notify('profile', 'accountChanged', address);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith('accountChanged', { address });

        const networkId = 12345;
        Web3Service.eventListeners.notify('profile', 'networkChanged', networkId);

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenLastCalledWith('networkChanged', {
            id: networkId,
            name: 'Ganache',
        });

        const chainId = 4;
        Web3Service.eventListeners.notify('profile', 'chainChanged', chainId);

        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener).toHaveBeenLastCalledWith('chainChanged', {
            id: chainId,
            name: 'Rinkeby',
        });
    });
});

describe('ApiManager.handleResolveSession', () => {
    const options = {
        key: 'value',
    };

    let flushEnableListenersSpy;
    let profileListener;

    beforeEach(() => {
        flushEnableListenersSpy = jest.spyOn(manager, 'flushEnableListeners');

        profileListener = jest.fn();
        manager.eventListeners.add('profileChanged', profileListener);
    });

    it('take aztecAccount and notify listeners', () => {
        expect(manager.aztecAccount).toBe(null);
        expect(manager.error).toBe(null);

        const aztecAccount = {
            address: 'aztec-account-address',
        };
        manager.handleResolveSession(options, {
            aztecAccount,
        });

        expect(manager.aztecAccount).toBe(aztecAccount);
        expect(manager.error).toBe(null);
        expect(profileListener).toHaveBeenCalledTimes(1);
        expect(profileListener).toHaveBeenLastCalledWith('aztecAccountChanged', aztecAccount, null);
        expect(flushEnableListenersSpy).toHaveBeenCalledTimes(1);
        expect(flushEnableListenersSpy).toHaveBeenCalledWith(options);
    });

    it('take error and notify listeners', () => {
        expect(manager.aztecAccount).toBe(null);
        expect(manager.error).toBe(null);

        const error = {
            message: 'an error occurred',
        };
        manager.handleResolveSession(options, {
            error,
        });

        expect(manager.aztecAccount).toBe(null);
        expect(manager.error).toBe(error);
        expect(profileListener).toHaveBeenCalledTimes(1);
        expect(profileListener).toHaveBeenLastCalledWith('aztecAccountChanged', null, error);
        expect(flushEnableListenersSpy).toHaveBeenCalledTimes(1);
        expect(flushEnableListenersSpy).toHaveBeenCalledWith(options);
    });
});

describe('ApiManager enableListeners', () => {
    const options = {
        key: 'value',
    };

    it('trigger all listeners with aztecAccount and error and then clear them', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();
        manager.addEnableListener(options, listener1);
        manager.addEnableListener(options, listener2);

        const optionsKey = JSON.stringify(options);
        expect(manager.enableListenersMapping).toEqual({
            [optionsKey]: [
                listener1,
                listener2,
            ],
        });

        const aztecAccount = {
            address: 'aztec-account-address',
        };
        const error = {
            message: 'an error occurred',
        };
        manager.aztecAccount = aztecAccount;
        manager.error = error;

        manager.flushEnableListeners(options);

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith(aztecAccount, error);
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith(aztecAccount, error);

        expect(manager.enableListenersMapping).toEqual({});
    });
});

describe('ApiManager.enable', () => {
    const options = {
        key: 'value',
    };
    const options2 = {
        key: 'value2',
    };
    const aztecAccount = {
        address: 'aztec-account-address',
    };

    let refreshSessionSpy;
    let resolveRefreshSession;
    let mockCallback;

    const mockControllableRefreshSession = () => {
        resolveRefreshSession = () => {};
        refreshSessionSpy.mockImplementation((customOptions) => {
            resolveRefreshSession = () => {
                manager.aztecAccount = aztecAccount;
                manager.flushEnableListeners(customOptions);
            };
        });
    };

    beforeEach(() => {
        refreshSessionSpy = jest.spyOn(manager, 'refreshSession')
            .mockImplementation((customOptions) => {
                setTimeout(() => {
                    manager.aztecAccount = aztecAccount;
                    manager.flushEnableListeners(customOptions);
                }, 0);
            });

        mockCallback = jest.fn();
    });

    it('stash callback and return a promise and both will be called in refreshSession', async () => {
        mockControllableRefreshSession();

        const promise = manager.enable(options, mockCallback);

        expect(promise).toBeInstanceOf(Promise);
        expect(mockCallback).toHaveBeenCalledTimes(0);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
        expect(manager.currentOptions).toBe(options);
        expect(manager.enableListenersMapping).not.toEqual({});

        resolveRefreshSession();
        const resp = await promise;

        expect(resp).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
        expect(manager.currentOptions).toBe(options);
        expect(manager.enableListenersMapping).toEqual({});
    });

    it('resolve immediately if called with the same options', async () => {
        const resp = await manager.enable(options, mockCallback);

        expect(resp).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);

        const mockCallback2 = jest.fn();
        const resp2 = await manager.enable(options, mockCallback2);

        expect(resp2).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
        expect(manager.currentOptions).toBe(options);
        expect(manager.enableListenersMapping).toEqual({});
    });

    it('will not trigger refreshSession if called with the same options before the previous promise is resolved', async () => {
        mockControllableRefreshSession();

        const promise1 = manager.enable(options, mockCallback);
        const mockCallback2 = jest.fn();
        const promise2 = manager.enable(options, mockCallback2);

        expect(promise1).toBeInstanceOf(Promise);
        expect(promise2).toBeInstanceOf(Promise);
        expect(mockCallback).toHaveBeenCalledTimes(0);
        expect(mockCallback2).toHaveBeenCalledTimes(0);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);

        resolveRefreshSession();
        const [resp1, resp2] = await Promise.all([promise1, promise2]);

        expect(resp1).toBe(aztecAccount);
        expect(resp2).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(aztecAccount, null);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('run refreshSession again if called with different options', async () => {
        const resp = await manager.enable(options, mockCallback);
        expect(resp).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
        expect(manager.currentOptions).toBe(options);

        const mockCallback2 = jest.fn();
        const resp2 = await manager.enable(options2, mockCallback2);
        expect(resp2).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(2);
        expect(manager.currentOptions).toBe(options2);
    });

    it('resolve previous unresolved promise immediately if called with different options', async () => {
        mockControllableRefreshSession();

        const promise1 = manager.enable(options, mockCallback);

        const mockCallback2 = jest.fn();
        const promise2 = manager.enable(options2, mockCallback2);

        expect(promise1).toBeInstanceOf(Promise);
        expect(promise2).toBeInstanceOf(Promise);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(null, null);
        expect(mockCallback2).toHaveBeenCalledTimes(0);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(2);
        expect(manager.currentOptions).toBe(options2);

        resolveRefreshSession();
        const [resp1, resp2] = await Promise.all([promise1, promise2]);

        expect(resp1).toBe(null);
        expect(resp2).toBe(aztecAccount);
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(null, null);
        expect(mockCallback2).toHaveBeenCalledTimes(1);
        expect(mockCallback2).toHaveBeenCalledWith(aztecAccount, null);
        expect(refreshSessionSpy).toHaveBeenCalledTimes(2);
        expect(manager.currentOptions).toBe(options2);
    });
});

describe('ApiManager.refreshSession', () => {
    const contractAddresses = {
        ACE: 'ace_address',
        AccountRegistry: 'account_registry_address',
    };
    const generateNetworkConfig = ({ contractAddresses: addresses }) => ({
        networkId: 12345,
        error: null,
        contractsConfig: [
            {
                name: 'ACE',
                address: addresses.ACE,
            },
            {
                name: 'AccountRegistry',
                address: addresses.AccountRegistry,
            },
        ],
    });
    const openConnectionSpy = jest.spyOn(ConnectionService, 'openConnection')
        .mockImplementation(generateNetworkConfig);

    const validateContractConfigsSpy = jest.spyOn(ApiPermissionService, 'validateContractConfigs');

    const initWeb3ServiceSpy = jest.spyOn(Web3Service, 'init')
        .mockImplementation(jest.fn());

    const aztecAccount = {
        address: 'aztec_account_address',
        linkedPublicKey: 'aztec_account_linked_public_key',
    };
    const network = {};
    const ensurePermissionSpy = jest.spyOn(ApiPermissionService, 'ensurePermission')
        .mockImplementation(() => ({
            account: aztecAccount,
            network,
        }));

    const defaultApis = {
        run: jest.fn(),
    };
    const fullApis = {
        run: jest.fn(),
    };
    const generateApisSpy = jest.spyOn(ApiPermissionService, 'generateApis')
        .mockImplementation(useFullApis => (useFullApis && fullApis) || defaultApis);

    const apiKey = 'test-api-key';
    const options = {
        apiKey,
        contractAddresses,
        providerUrl: '',
    };
    let mockSetApis;
    let resolveSessionSpy;

    beforeEach(() => {
        openConnectionSpy.mockClear();
        validateContractConfigsSpy.mockClear();
        initWeb3ServiceSpy.mockClear();
        ensurePermissionSpy.mockClear();
        generateApisSpy.mockClear();

        mockSetApis = jest.fn();
        manager.setApis = mockSetApis;
        manager.currentOptions = options;

        resolveSessionSpy = jest.spyOn(manager, 'handleResolveSession');
    });

    afterEach(() => {
        manager.unbindOneTimeProfileChangeListener();
    });

    afterAll(() => {
        openConnectionSpy.mockRestore();
        initWeb3ServiceSpy.mockRestore();
        ensurePermissionSpy.mockRestore();
        generateApisSpy.mockRestore();
    });

    it('run a series of tasks and set full apis and notify listeners when finished', async () => {
        await manager.refreshSession(options);

        expect(openConnectionSpy).toHaveBeenCalledTimes(1);
        expect(openConnectionSpy).toHaveBeenCalledWith(options);

        const {
            error,
            ...networkConfig
        } = generateNetworkConfig(options);

        expect(validateContractConfigsSpy).toHaveBeenCalledTimes(1);
        expect(validateContractConfigsSpy).toHaveBeenCalledWith(networkConfig);

        expect(initWeb3ServiceSpy).toHaveBeenCalledTimes(1);
        expect(initWeb3ServiceSpy).toHaveBeenCalledWith(networkConfig);

        expect(ensurePermissionSpy).toHaveBeenCalledTimes(1);

        expect(resolveSessionSpy).toHaveBeenCalledTimes(1);
        expect(resolveSessionSpy).toHaveBeenCalledWith(options, {
            aztecAccount,
        });

        expect(mockSetApis).toHaveBeenLastCalledWith(fullApis);
    });

    it('stop running remaining tasks if an error occurred while opening connection', async () => {
        const error = {
            message: 'an error occurred',
        };
        openConnectionSpy.mockImplementationOnce(() => ({
            ...generateNetworkConfig(options),
            error,
        }));

        await manager.refreshSession(options);

        expect(openConnectionSpy).toHaveBeenCalledTimes(1);
        expect(initWeb3ServiceSpy).toHaveBeenCalledTimes(0);
        expect(ensurePermissionSpy).toHaveBeenCalledTimes(0);
        expect(resolveSessionSpy).toHaveBeenCalledTimes(1);
        expect(resolveSessionSpy).toHaveBeenCalledWith(options, {
            error,
        });
        expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
    });

    it('stop running remaining tasks if an error occurred during a task', async () => {
        const error = {
            message: 'an error occurred',
        };
        const taskSpies = [
            validateContractConfigsSpy,
            initWeb3ServiceSpy,
            ensurePermissionSpy,
        ];

        await asyncForEach(taskSpies, async (spy, currentIdx) => {
            spy.mockImplementationOnce(() => {
                throw error;
            });

            taskSpies.forEach((task) => {
                task.mockClear();
            });
            resolveSessionSpy.mockClear();

            await manager.refreshSession(options);

            taskSpies.forEach((task, i) => {
                if (i <= currentIdx) {
                    expect(task).toHaveBeenCalledTimes(1);
                } else {
                    expect(task).toHaveBeenCalledTimes(0);
                }
            });

            expect(resolveSessionSpy).toHaveBeenCalledTimes(1);
            expect(resolveSessionSpy).toHaveBeenCalledWith(options, {
                error,
            });
            expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
        });
    });

    it('will not run task if options are different from current options', async () => {
        manager.currentOptions = {
            ...options,
            apiKey: `${options.apiKey}-2`,
        };
        await manager.refreshSession(options);

        expect(openConnectionSpy).toHaveBeenCalledTimes(0);
        expect(initWeb3ServiceSpy).toHaveBeenCalledTimes(0);
        expect(ensurePermissionSpy).toHaveBeenCalledTimes(0);
        expect(resolveSessionSpy).toHaveBeenCalledTimes(0);
        expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
    });

    it('stop running task if options are changed while running a task', async () => {
        const options2 = {
            ...options,
            apiKey: `${options.apiKey}-2`,
        };
        const taskSpies = [
            openConnectionSpy,
            validateContractConfigsSpy,
            initWeb3ServiceSpy,
            ensurePermissionSpy,
        ];

        await asyncForEach(taskSpies, async (spy, currentIdx) => {
            taskSpies.forEach((task) => {
                task.mockClear();
            });
            resolveSessionSpy.mockClear();

            manager.currentOptions = options;

            spy.mockImplementationOnce(() => {
                manager.currentOptions = options2;
            });

            await manager.refreshSession(options);

            taskSpies.forEach((task, i) => {
                if (i <= currentIdx) {
                    expect(task).toHaveBeenCalledTimes(1);
                } else {
                    expect(task).toHaveBeenCalledTimes(0);
                }
            });

            expect(resolveSessionSpy).toHaveBeenCalledTimes(0);
            expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
        });
    });

    it('reject if at least one contract address is not defined', async () => {
        await asyncForEach(
            [
                ['ACE'],
                ['AccountRegistry'],
                ['ACE', 'AccountRegistry'],
            ],
            async (emptyContracts) => {
                openConnectionSpy.mockClear();
                validateContractConfigsSpy.mockClear();
                resolveSessionSpy.mockClear();

                const addresses = { ...contractAddresses };
                emptyContracts.forEach((name) => {
                    addresses[name] = '';
                });
                const customOptions = {
                    apiKey,
                    contractAddresses: addresses,
                };

                manager.currentOptions = customOptions;

                await manager.refreshSession(customOptions);

                expect(openConnectionSpy).toHaveBeenCalledTimes(1);
                expect(validateContractConfigsSpy).toHaveBeenCalledTimes(1);

                expect(resolveSessionSpy).toHaveBeenCalledTimes(1);
                expect(resolveSessionSpy).toHaveBeenLastCalledWith(customOptions, {
                    error: expect.objectContaining({
                        key: 'input.contract.address.empty',
                        message: expect.stringContaining(emptyContracts[0]),
                    }),
                });

                expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
            },
        );
    });

    it('stop remaining tasks and run refreshSession from the begining if network or account is changed', async () => {
        const options2 = {
            ...options,
            two: 2,
        };
        const taskSpies = [
            openConnectionSpy,
            validateContractConfigsSpy,
            initWeb3ServiceSpy,
            ensurePermissionSpy,
        ];

        manager.currentOptions = options2;
        const refreshSessionSpy = jest.spyOn(manager, 'refreshSession');

        await asyncForEach(taskSpies, async (spy, currentIdx) => {
            taskSpies.forEach((task) => {
                task.mockClear();
                expect(task).toHaveBeenCalledTimes(0);
            });
            resolveSessionSpy.mockClear();

            spy.mockImplementationOnce(() => {
                Web3Service.eventListeners.notify(
                    'profile',
                    'accountChanged',
                    'new-address',
                );
            });

            const promise = manager.refreshSession(options2);

            refreshSessionSpy.mockClear();
            refreshSessionSpy.mockImplementationOnce(jest.fn());

            expect(refreshSessionSpy).toHaveBeenCalledTimes(0);
            taskSpies.forEach((task) => {
                expect(task).toHaveBeenCalledTimes(0);
            });

            await promise;

            expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
            expect(refreshSessionSpy).toHaveBeenCalledWith(options2);

            taskSpies.forEach((task, i) => {
                if (i <= currentIdx) {
                    expect(task).toHaveBeenCalledTimes(1);
                } else {
                    expect(task).toHaveBeenCalledTimes(0);
                }
            });

            expect(resolveSessionSpy).toHaveBeenCalledTimes(0);
            expect(mockSetApis).toHaveBeenLastCalledWith(defaultApis);
        });
    });

    it('run refreshSession again if network or account is changed', async () => {
        manager.currentOptions = options;

        const promise = manager.refreshSession(options);

        const refreshSessionSpy = jest.spyOn(manager, 'refreshSession')
            .mockImplementation(jest.fn());

        await promise;

        expect(refreshSessionSpy).toHaveBeenCalledTimes(0);

        Web3Service.eventListeners.notify(
            'profile',
            'accountChanged',
            'new-address',
        );

        expect(refreshSessionSpy).toHaveBeenCalledTimes(1);
        expect(refreshSessionSpy).toHaveBeenCalledWith(options);
    });

    it('will not run refreshSession again if autoRefreshOnProfileChange is false', async () => {
        manager.currentOptions = options;
        manager.autoRefreshOnProfileChange = false;

        const promise = manager.refreshSession(options);

        const refreshSessionSpy = jest.spyOn(manager, 'refreshSession');

        await promise;

        expect(refreshSessionSpy).toHaveBeenCalledTimes(0);

        Web3Service.eventListeners.notify(
            'profile',
            'accountChanged',
            'new-address',
        );

        expect(refreshSessionSpy).toHaveBeenCalledTimes(0);
    });

    it('will flush listeners when profile is changed if autoRefreshOnProfileChange is false', async () => {
        manager.currentOptions = options;
        manager.autoRefreshOnProfileChange = false;

        const flushEnableListenersSpy = jest.spyOn(manager, 'flushEnableListeners');

        const taskSpies = [
            openConnectionSpy,
            validateContractConfigsSpy,
            initWeb3ServiceSpy,
            ensurePermissionSpy,
        ];

        await asyncForEach(taskSpies, async (spy, currentIdx) => {
            taskSpies.forEach((task) => {
                task.mockClear();
            });
            resolveSessionSpy.mockClear();
            flushEnableListenersSpy.mockClear();

            spy.mockImplementationOnce(() => {
                Web3Service.eventListeners.notify(
                    'profile',
                    'accountChanged',
                    'new-address',
                );
            });

            const promise = manager.refreshSession(options);

            const refreshSessionSpy = jest.spyOn(manager, 'refreshSession')
                .mockImplementation(jest.fn());

            expect(refreshSessionSpy).toHaveBeenCalledTimes(0);

            await promise;

            expect(refreshSessionSpy).toHaveBeenCalledTimes(0);

            taskSpies.forEach((task, i) => {
                if (i <= currentIdx) {
                    expect(task).toHaveBeenCalledTimes(1);
                } else {
                    expect(task).toHaveBeenCalledTimes(0);
                }
            });

            expect(resolveSessionSpy).toHaveBeenCalledTimes(0);
            expect(flushEnableListenersSpy).toHaveBeenCalledTimes(1);
            expect(flushEnableListenersSpy).toHaveBeenCalledWith(options);

            refreshSessionSpy.mockRestore();
        });
    });
});
