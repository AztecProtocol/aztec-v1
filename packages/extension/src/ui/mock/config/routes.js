import Home from '~/ui/views/Home';
import Loading from '~/ui/views/Loading';
import Register from '~/ui/pages/Register';
import RegisterAddress from '~/ui/pages/RegisterAddress';
import DomainPermission from '~/ui/pages/DomainPermission';
import Restore from '~/ui/pages/Restore';
import Login from '~/ui/pages/Login';
import NoteAccess from '~/ui/pages/NoteAccess';
import Icons from '~/ui/views/playground/Icons';
import DepositContent from '~/ui/views/DepositContent';
import depositSteps from '~/ui/steps/deposit';
import createNoteFromBalanceSteps from '~/ui/steps/createNoteFromBalance';
import {
    registerSteps,
    withdrawSteps,
    sendSteps,
} from '~/ui/config/steps';

export default {
    _: {
        Component: Home,
    },
    loading: {
        path: 'loading',
        Component: Loading,
    },
    register: {
        path: 'register',
        Component: Register,
        routes: {
            backup: {
                path: 'backup',
                step: registerSteps.gsn[1],
            },
            password: {
                path: 'password',
                step: registerSteps.gsn[2],
            },
            link: {
                path: 'link-account',
                step: registerSteps.gsn[3],
            },
            confirm: {
                path: 'confirm',
                step: registerSteps.gsn[4],
            },
            address: {
                path: 'address',
                Component: RegisterAddress,
                routes: {
                    confirm: {
                        path: 'confirm',
                        Component: RegisterAddress,
                        initialStep: 1,
                    },
                },
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
                routes: {
                    password: {
                        path: 'set-new-password',
                        Component: Restore,
                        initialStep: 1,
                    },
                },
            },
            login: {
                path: 'login',
                Component: Login,
            },
        },
    },
    deposit: {
        path: 'deposit',
        Content: DepositContent,
        steps: depositSteps.gsn,
        initialStep: 0,
        routes: {
            confirm: {
                path: 'confirm',
                Content: DepositContent,
                steps: depositSteps.gsn,
                initialStep: 1,
            },
            send: {
                path: 'send',
                Content: DepositContent,
                steps: depositSteps.gsn,
                initialStep: 2,
            },
        },
    },
    withdraw: {
        path: 'withdraw',
        step: withdrawSteps.gsn[0],
        routes: {
            sign: {
                path: 'sign',
                step: withdrawSteps.gsn[1],
            },
            send: {
                path: 'send',
                step: withdrawSteps.gsn[2],
            },
        },
    },
    send: {
        path: 'send',
        step: sendSteps.gsn[0],
        routes: {
            sign: {
                path: 'sign',
                step: sendSteps.gsn[1],
                initialStep: 1,
            },
            send: {
                path: 'send',
                step: sendSteps.gsn[2],
                initialStep: 2,
            },
        },
    },
    createNote: {
        path: 'create-note',
        step: createNoteFromBalanceSteps.gsn[0],
        routes: {
            sign: {
                path: 'sign',
                step: createNoteFromBalanceSteps.gsn[1],
            },
            send: {
                path: 'send',
                step: createNoteFromBalanceSteps.gsn[2],
            },
        },
    },
    noteAccess: {
        path: 'note-access',
        Component: NoteAccess,
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
                    notes: {
                        path: 'notes',
                        Component: Icons,
                    },
                },
            },
        },
    },
};
