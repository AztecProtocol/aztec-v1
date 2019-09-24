import Home from '~ui/views/Home';
import Loading from '~ui/views/Loading';
import Welcome from '~ui/views/Welcome';
import Register from '~ui/views/pages/Register';
import BackupKeys from '~ui/views/BackupKeys';
import ConfirmBackupKeys from '~ui/views/ConfirmBackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import DomainPermission from '~ui/views/DomainPermission';
import Account from '~ui/views/pages/Account';
import Assets from '~ui/views/Assets';
import Asset from '~ui/views/Asset';
import Restore from '~ui/views/Restore';
import Login from '~ui/views/Login';
import RegisterAddress from '~ui/views/RegisterAddress';
import NoteAccess from '~ui/views/pages/NoteAccess';
import ConfirmNoteAccess from '~ui/views/ConfirmNoteAccess';
import GrantNoteAccess from '~ui/views/GrantNoteAccess';
import Deposit from '~ui/views/Deposit';
import Send from '~ui/views/Send';

/*
 * Component can be rendered from background script and by clicking extension icon
 * while View can only be access directly from devServer
 */
export default {
    _: {
        Component: Home,
    },
    loading: {
        path: 'loading',
        View: Loading,
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
                View: BackupKeys,
            },
            confirm: {
                path: 'confirm',
                View: ConfirmBackupKeys,
            },
            password: {
                path: 'password',
                View: CreatePassword,
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
    noteAccess: {
        path: 'note-access',
        Component: NoteAccess,
        routes: {
            confirm: {
                path: 'confirm',
                View: ConfirmNoteAccess,
            },
            grant: {
                path: 'grant',
                View: GrantNoteAccess,
            },
        },
    },
    deposit: {
        path: 'deposit',
        Component: Deposit,
    },
    send: {
        path: 'send',
        Component: Send,
    },
};
