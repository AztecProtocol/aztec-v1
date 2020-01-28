import apis from '~uiModules/apis';

const stepCreatePassword = {
    name: 'create',
    descriptionKey: 'account.create.description',
    tasks: [
        {
            run: apis.auth.createSeedPhrase,
        },
        {
            run: apis.auth.backupSeedPhrase,
        },
        {
            run: apis.auth.createPwDerivedKey,
        },
        {
            run: apis.auth.createKeyStore,
        },
    ],
    submitTextKey: 'account.create.submit',
};

const stepLink = {
    name: 'link',
    blockStyle: 'linked',
    descriptionKey: 'account.link.description',
    tasks: [],
    submitTextKey: 'account.link.submit',
};

const stepSign = {
    name: 'sign',
    blockStyle: 'collapsed',
    descriptionKey: 'account.link.description',
    tasks: [
        {
            name: 'link',
            type: 'sign',
            run: apis.auth.linkAccountToMetaMask,
        },
    ],
    autoStart: true,
    submitTextKey: 'transaction.sign.submit',
};

const stepConfirm = {
    name: 'confirm',
    blockStyle: 'collapsed',
    descriptionKey: 'account.link.description',
    tasks: [],
    submitTextKey: 'transaction.send.submit',
};

const stepSend = {
    name: 'send',
    blockStyle: 'sealed',
    descriptionKey: 'account.create.send.description',
    tasks: [
        {
            titleKey: 'transaction.step.sign',
            run: apis.auth.registerExtension,
        },
        {
            type: 'sign',
            titleKey: 'account.create.send.step',
            run: apis.auth.registerAccountOnChain,
        },
        {
            titleKey: 'account.create.step',
            run: apis.auth.registerAddress,
        },
        {
            titleKey: 'transaction.confirmed',
        },
    ],
    showTaskList: true,
    autoStart: true,
    submitTextKey: 'transaction.send.submit',
};

const stepSendViaGSN = {
    name: 'send',
    blockStyle: 'sealed',
    descriptionKey: 'transaction.gsn.send.description',
    tasks: [
        {
            titleKey: 'transaction.step.sign',
            run: apis.auth.registerExtension,
        },
        {
            titleKey: 'transaction.step.relay',
            run: apis.auth.registerAccountOnChain,
        },
        {
            titleKey: 'account.create.step',
            run: apis.auth.registerAddress,
        },
        {
            titleKey: 'transaction.confirmed',
        },
    ],
    showTaskList: true,
    autoStart: true,
    submitTextKey: 'transaction.send.submit',
};

export default {
    gsn: [
        stepCreatePassword,
        stepLink,
        stepSign,
        stepConfirm,
        stepSendViaGSN,
    ],
    metamask: [
        stepCreatePassword,
        stepLink,
        stepSign,
        stepConfirm,
        stepSend,
    ],
};
