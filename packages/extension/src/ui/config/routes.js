import Home from '~ui/views/Home';
import Register from '~ui/views/controllers/Register';
import BackupKeys from '~ui/views/BackupKeys';
import ConfirmBackupKeys from '~ui/views/ConfirmBackupKeys';
import Account from '~ui/views/controllers/Account';
import Assets from '~ui/views/Assets';
import Asset from '~ui/views/Asset';
import Restore from '~ui/views/Restore';
import RegisterAddress from '~ui/views/RegisterAddress';
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
            restore: {
                path: 'restore-account',
                Component: Restore,
            },
            address: {
                path: 'address',
                Component: RegisterAddress,
            },
        },
    },
    account: {
        path: 'account',
        Component: Account,
        routes: {
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
    },
    send: {
        path: 'send',
        Component: Send,
    },
};
