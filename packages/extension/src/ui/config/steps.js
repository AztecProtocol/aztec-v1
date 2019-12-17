import RegisterIntro from '~/ui/views/RegisterIntro';
import BackupKeys from '~/ui/views/BackupKeys';
import CreatePassword from '~/ui/views/CreatePassword';
import LinkAccount from '~/ui/views/LinkAccount';
import RegisterConfirm from '~/ui/views/RegisterConfirm';
import TransactionSend from '~/ui/views/TransactionSend';
import WithdrawConfirm from '~/ui/views/WithdrawConfirm';
import SignNotes from '~/ui/views/SignNotes';
import SendConfirm from '~/ui/views/SendConfirm';
import apis from '~uiModules/apis';

export const sendSteps = {
    gsn: [

        {
            titleKey: 'send.confirm.title',
            submitTextKey: 'send.confirm.submit',
            content: SendConfirm,
            tasks: [
                {
                    name: 'proof',
                    run: apis.proof.transfer,
                },
            ],
        },
        {
            titleKey: 'send.notes.title',
            submitTextKey: 'send.notes.submit',
            content: SignNotes,
            tasks: [
                {
                    type: 'sign',
                    name: 'approve',
                    run: apis.note.batchSignNotes,
                },
            ],
        },
        {
            titleKey: 'send.send.title',
            submitTextKey: 'send.send.submit',
            content: TransactionSend,
            contentProps: {
                descriptionKey: 'send.send.explain',
            },
            tasks: [
                {
                    name: 'send',
                    run: apis.asset.confidentialTransferFrom,
                },
            ],
        },
    ],
    metamask: [
        {
            titleKey: 'send.confirm.title',
            submitTextKey: 'send.confirm.submit',
            content: SendConfirm,
            tasks: [
                {
                    name: 'proof',
                    run: apis.proof.transfer,
                },
            ],
        },
        {
            titleKey: 'send.notes.title',
            submitTextKey: 'send.notes.submit',
            content: SignNotes,
            tasks: [
                {
                    type: 'sign',
                    name: 'approve',
                    run: apis.note.signNotes,
                },
            ],
        },
        {
            titleKey: 'send.send.title',
            submitTextKey: 'send.send.submit',
            content: TransactionSend,
            contentProps: {
                descriptionKey: 'send.send.explain',
            },
            tasks: [
                {
                    name: 'send',
                    run: apis.asset.confidentialTransfer,
                },
            ],
        },

    ],
};

export const withdrawSteps = {
    gsn: [
        {
            titleKey: 'withdraw.confirm.title',
            submitTextKey: 'withdraw.confirm.submit',
            content: WithdrawConfirm,
            tasks: [
                {
                    name: 'proof',
                    run: apis.proof.withdraw,
                },
            ],
        },
        {
            titleKey: 'withdraw.notes.title',
            submitTextKey: 'withdraw.notes.submit',
            content: SignNotes,
            tasks: [
                {
                    type: 'sign',
                    name: 'approve',
                    run: apis.note.batchSignNotes,
                },
            ],
        },
        {
            titleKey: 'withdraw.send.title',
            submitTextKey: 'withdraw.send.submit',
            content: TransactionSend,
            tasks: [
                {
                    name: 'send',
                    run: apis.asset.confidentialTransferFrom,
                },
            ],
        },
    ],
    metamask: [

        {
            titleKey: 'withdraw.confirm.title',
            submitTextKey: 'withdraw.confirm.submit',
            content: WithdrawConfirm,
            tasks: [
                {
                    name: 'proof',
                    run: apis.proof.withdraw,
                },
            ],
        },
        {
            titleKey: 'withdraw.notes.title',
            submitTextKey: 'withdraw.notes.submit',
            content: SignNotes,
            tasks: [
                {
                    type: 'sign',
                    name: 'approve',
                    run: apis.note.batchSignNotes,
                },
            ],
        },
        {
            titleKey: 'withdraw.send.title',
            submitTextKey: 'withdraw.send.submit',
            content: TransactionSend,
            contentProps: {
                descriptionKey: 'withdraw.send.explain',
            },
            tasks: [
                {
                    name: 'send',
                    run: apis.asset.confidentialTransfer,
                },
            ],
        },
    ],
};

export const registerSteps = {
    gsn: [
        {
            titleKey: 'register.create.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createSeedPhrase,
                },
            ],
            content: RegisterIntro,
            submitTextKey: 'register.create.submit',
        },
        {
            titleKey: 'register.backup.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.backupSeedPhrase,
                },
            ],
            content: BackupKeys,
            submitTextKey: 'register.backup.submit',
        },
        {
            titleKey: 'register.password.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createPwDerivedKey,
                },
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createKeyStore,
                },
            ],
            content: CreatePassword,
            onSubmit: ({ password }) => {
                if (!password || !password.trim()) {
                    return {
                        error: {
                            key: 'account.password.error.empty',
                        },
                    };
                }
                return null;
            },
            submitTextKey: 'register.password.submit',
        },
        {
            titleKey: 'register.linkAccount.title',
            tasks: [
                {
                    name: 'link',
                    type: 'sign',
                    run: apis.auth.linkAccountToMetaMask,
                },
                {
                    name: 'register_extension',
                    run: apis.auth.registerExtension,
                },
            ],
            content: LinkAccount,
            submitTextKey: 'register.linkAccount.submit',
        },
        {
            titleKey: 'register.confirm.title',
            content: RegisterConfirm,
            submitTextKey: 'register.confirm.submit',
            tasks: [
                {
                    name: 'authorise',
                    run: apis.auth.sendGSNRegisterTx,
                },
                {
                    name: 'register_address',
                    run: apis.auth.registerAddress,
                },
            ],
        },
    ],
    metamask: [

        {
            titleKey: 'register.create.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createSeedPhrase,
                },
            ],
            content: RegisterIntro,
            submitTextKey: 'register.create.submit',
        },
        {
            titleKey: 'register.backup.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.backupSeedPhrase,
                },
            ],
            content: BackupKeys,
            submitTextKey: 'register.backup.submit',
        },
        {
            titleKey: 'register.password.title',
            tasks: [
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createPwDerivedKey,
                },
                {
                    type: 'auth',
                    name: 'create',
                    run: apis.auth.createKeyStore,
                },
            ],
            content: CreatePassword,
            onSubmit: ({ password }) => {
                if (!password || !password.trim()) {
                    return {
                        error: {
                            key: 'account.password.error.empty',
                        },
                    };
                }
                return null;
            },
            submitTextKey: 'register.password.submit',
        },
        {
            titleKey: 'register.linkAccount.title',
            tasks: [
                {
                    name: 'link',
                    type: 'sign',
                    run: apis.auth.linkAccountToMetaMask,
                },
                {
                    name: 'register_extension',
                    run: apis.auth.registerExtension,
                },
            ],
            content: LinkAccount,
            submitTextKey: 'register.linkAccount.submit',
        },
        {
            titleKey: 'register.confirm.title',
            content: RegisterConfirm,
            submitTextKey: 'register.confirm.submit',
            tasks: [
                {
                    name: 'authorise',
                    run: apis.auth.sendRegisterAddress,
                },
                {
                    name: 'register_address',
                    run: apis.auth.registerAddress,
                },
            ],
        },
    ],
};

export const linkAccountSteps = {
    gsn: [
        {
            titleKey: 'register.linkAccount.title',
            tasks: [
                {
                    name: 'get',
                    run: apis.auth.getAccountKeys,
                },
                {
                    name: 'link',
                    type: 'sign',
                    run: apis.auth.linkAccountToMetaMask,
                },
            ],
            content: LinkAccount,
            submitTextKey: 'register.linkAccount.submit',
        },
        {
            titleKey: 'register.confirm.title',
            content: RegisterConfirm,
            submitTextKey: 'register.confirm.submit',
            tasks: [
                {
                    name: 'authorise',
                    run: apis.auth.sendGSNRegisterTx,
                },
                {
                    name: 'register_address',
                    run: apis.auth.registerAddress,
                },
            ],
        },

    ],
    metamask: [
        {
            titleKey: 'register.linkAccount.title',
            tasks: [
                {
                    name: 'get',
                    run: apis.auth.getAccountKeys,
                },
                {
                    name: 'link',
                    type: 'sign',
                    run: apis.auth.linkAccountToMetaMask,
                },
            ],
            content: LinkAccount,
            submitTextKey: 'register.linkAccount.submit',
        },
        {
            titleKey: 'register.confirm.title',
            content: RegisterConfirm,
            submitTextKey: 'register.confirm.submit',
            tasks: [
                {
                    name: 'authorise',
                    run: apis.auth.sendRegisterAddress,
                },
                {
                    name: 'register_address',
                    run: apis.auth.registerAddress,
                },
            ],
        },
    ],
};
