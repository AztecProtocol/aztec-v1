import Home from '~/ui/views/Home';
import Loading from '~/ui/views/Loading';
import RegisterContent from '~/ui/views/RegisterContent';
import DomainPermission from '~/ui/pages/DomainPermission';
import Restore from '~/ui/pages/Restore';
import Login from '~/ui/pages/Login';
import Icons from '~/ui/views/playground/Icons';
import DepositContent from '~/ui/views/DepositContent';
import WithdrawContent from '~/ui/views/WithdrawContent';
import SendContent from '~/ui/views/SendContent';
import CreateNoteFromBalanceContent from '~/ui/views/CreateNoteFromBalanceContent';
import GrantNoteAccessContent from '~/ui/views/GrantNoteAccessContent';
import registerSteps from '~/ui/steps/register';
import depositSteps from '~/ui/steps/deposit';
import withdrawSteps from '~/ui/steps/withdraw';
import sendSteps from '~/ui/steps/send';
import createNoteFromBalanceSteps from '~/ui/steps/createNoteFromBalance';
import grantNoteAccessSteps from '~/ui/steps/grantNoteAccess';

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
        Content: RegisterContent,
        steps: registerSteps.gsn,
        initialStep: 0,
        routes: {
            link: {
                path: 'link-account',
                Content: RegisterContent,
                steps: registerSteps.gsn,
                initialStep: 1,
            },
            sign: {
                path: 'sign',
                Content: RegisterContent,
                steps: registerSteps.gsn,
                initialStep: 2,
            },
            confirm: {
                path: 'confirm',
                Content: RegisterContent,
                steps: registerSteps.gsn,
                initialStep: 3,
            },
            send: {
                path: 'send',
                Content: RegisterContent,
                steps: registerSteps.gsn,
                initialStep: 4,
            },
            address: {
                path: 'address',
                Content: RegisterContent,
                steps: registerSteps.gsn.slice(1),
                initialStep: 0,
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
        Content: WithdrawContent,
        steps: withdrawSteps.gsn,
        initialStep: 0,
        routes: {
            sign: {
                path: 'sign',
                Content: WithdrawContent,
                steps: withdrawSteps.gsn,
                initialStep: 1,
            },
            confirm: {
                path: 'confirm',
                Content: WithdrawContent,
                steps: withdrawSteps.gsn,
                initialStep: 2,
            },
            send: {
                path: 'send',
                Content: WithdrawContent,
                steps: withdrawSteps.gsn,
                initialStep: 3,
            },
            metamask: {
                path: 'metamask',
                Content: WithdrawContent,
                steps: withdrawSteps.metamask,
                initialStep: 0,
            },
        },
    },
    send: {
        path: 'send',
        Content: SendContent,
        steps: sendSteps.gsn,
        initialStep: 0,
        routes: {
            sign: {
                path: 'sign',
                Content: SendContent,
                steps: sendSteps.gsn,
                initialStep: 1,
            },
            confirm: {
                path: 'confirm',
                Content: SendContent,
                steps: sendSteps.gsn,
                initialStep: 2,
            },
            send: {
                path: 'send',
                Content: SendContent,
                steps: sendSteps.gsn,
                initialStep: 3,
            },
        },
    },
    createNote: {
        path: 'create-note',
        Content: CreateNoteFromBalanceContent,
        steps: createNoteFromBalanceSteps.gsn,
        initialStep: 0,
        routes: {
            sign: {
                path: 'sign',
                Content: CreateNoteFromBalanceContent,
                steps: createNoteFromBalanceSteps.gsn,
                initialStep: 1,
            },
            confirm: {
                path: 'confirm',
                Content: CreateNoteFromBalanceContent,
                steps: createNoteFromBalanceSteps.gsn,
                initialStep: 2,
            },
            send: {
                path: 'send',
                Content: CreateNoteFromBalanceContent,
                steps: createNoteFromBalanceSteps.gsn,
                initialStep: 3,
            },
        },
    },
    noteAccess: {
        path: 'note-access',
        Content: GrantNoteAccessContent,
        steps: grantNoteAccessSteps.gsn,
        initialStep: 0,
        routes: {
            send: {
                path: 'send',
                Content: GrantNoteAccessContent,
                steps: grantNoteAccessSteps.gsn,
                initialStep: 1,
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
                    notes: {
                        path: 'notes',
                        Component: Icons,
                    },
                },
            },
        },
    },
};
