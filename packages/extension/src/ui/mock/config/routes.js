import Home from '~/ui/views/Home';
import Loading from '~/ui/views/Loading';
import Welcome from '~/ui/views/Welcome';
import Register from '~/ui/pages/Register';
import RegisterAddress from '~/ui/pages/RegisterAddress';
import CreatePassword from '~/ui/views/CreatePassword';
import DomainPermission from '~/ui/pages/DomainPermission';
import Account from '~/ui/pages/Account';
import Assets from '~/ui/views/Assets';
import Asset from '~/ui/views/Asset';
import Restore from '~/ui/pages/Restore';
import RestoreFailed from '~/ui/views/RestoreFailed';
import DuplicatedAccount from '~/ui/views/DuplicatedAccount';
import Login from '~/ui/pages/Login';
import NoteAccess from '~/ui/pages/NoteAccess';
import NoteAccessConfirm from '~/ui/views/NoteAccessConfirm';
import NoteAccessTransaction from '~/ui/views/NoteAccessTransaction';
import Deposit from '~/ui/pages/Deposit';
import Withdraw from '~/ui/pages/Withdraw';
import Send from '~/ui/pages/Send';
import Icons from '~/ui/views/playground/Icons';

export default {
    _: {
        Component: Home,
    },
    loading: {
        path: 'loading',
        Component: Loading,
    },
    welcome: {
        path: 'welcome',
        Component: Welcome,
    },
    register: {
        path: 'register',
        Component: Register,
        routes: {
            backup: {
                path: 'backup',
                Component: Register,
                initialStep: 1,
            },
            password: {
                path: 'password',
                Component: Register,
                initialStep: 2,
            },
            link: {
                path: 'link-account',
                Component: Register,
                initialStep: 3,
            },
            confirm: {
                path: 'confirm',
                Component: Register,
                initialStep: 4,
            },
            address: {
                path: 'address',
                Component: RegisterAddress,
            },
            domain: {
                path: 'domain',
                Component: DomainPermission,
            },
        },
    },
    account: {
        path: 'account',
        Component: Account,
        routes: {
            restore: {
                path: 'restore',
                Component: Restore,
                routes: {
                    password: {
                        path: 'set-new-password',
                        View: CreatePassword,
                    },
                    failed: {
                        path: 'error',
                        View: RestoreFailed,
                    },
                },
            },
            duplicated: {
                path: 'duplicated',
                View: DuplicatedAccount,
            },
            login: {
                path: 'login',
                Component: Login,
            },
            assets: {
                path: 'assets',
                View: Assets,
            },
            asset: {
                path: 'asset',
                View: Asset,
            },
        },
    },
    deposit: {
        path: 'deposit',
        Component: Deposit,
        routes: {
            approve: {
                path: 'approve',
                Component: Deposit,
                initialStep: 1,
            },
            send: {
                path: 'send',
                Component: Deposit,
                initialStep: 2,
            },
        },
    },
    withdraw: {
        path: 'withdraw',
        Component: Withdraw,
        routes: {
            sign: {
                path: 'sign',
                Component: Withdraw,
                initialStep: 1,
            },
            send: {
                path: 'send',
                Component: Withdraw,
                initialStep: 2,
            },
        },
    },
    noteAccess: {
        path: 'note-access',
        Component: NoteAccess,
        routes: {
            confirm: {
                path: 'confirm',
                View: NoteAccessConfirm,
            },
            grant: {
                path: 'grant',
                View: NoteAccessTransaction,
            },
        },
    },
    send: {
        path: 'send',
        Component: Send,
        routes: {
            sign: {
                path: 'sign',
                Component: Send,
                initialStep: 1,
            },
            send: {
                path: 'send',
                Component: Send,
                initialStep: 2,
            },
        },
    },
    playground: {
        path: 'playground',
        routes: {
            icons: {
                path: 'icons',
                routes: {
                    assets: {
                        path: 'assets',
                        Component: Icons,
                    },
                    users: {
                        path: 'users',
                        Component: Icons,
                    },
                },
            },
        },
    },
};
