import Home from '~/ui/views/Home';
import Register from '~/ui/pages/Register';
import RegisterAddress from '~/ui/pages/RegisterAddress';
import DomainPermission from '~/ui/pages/DomainPermission';
import Restore from '~/ui/pages/Restore';
import Login from '~/ui/pages/Login';
import NoteAccess from '~/ui/pages/NoteAccess';
import Deposit from '~/ui/pages/Deposit';
import Withdraw from '~/ui/pages/Withdraw';
import Send from '~/ui/pages/Send';
import CreateNoteFromBalance from '~/ui/pages/CreateNoteFromBalance';

export default {
    _: {
        Component: Home,
    },
    register: {
        path: 'register',
        Component: Register,
        routes: {
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
        routes: {
            restore: {
                path: 'restore',
                Component: Restore,
            },
            login: {
                path: 'login',
                Component: Login,
            },
        },
    },
    deposit: {
        path: 'deposit',
        Component: Deposit,
    },
    withdraw: {
        path: 'withdraw',
        Component: Withdraw,
    },
    noteAccess: {
        path: 'note-access',
        Component: NoteAccess,
    },
    send: {
        path: 'send',
        Component: Send,
    },
    createNote: {
        path: 'create-note',
        Component: CreateNoteFromBalance,
    },
};
