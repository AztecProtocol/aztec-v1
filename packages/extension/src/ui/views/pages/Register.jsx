import React from 'react';
import PropTypes from 'prop-types';
import { KeyStore } from '~utils/keyvault';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import Intro from '~ui/views/RegisterIntro';
import BackupKeys from '~ui/views/BackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import LinkAccount from '~ui/views/LinkAccount';
import ConfirmRegister from '~ui/views/RegisterConfirm';
import apis from '~uiModules/apis';

const newAccountSteps = [
    {
        titleKey: 'register.create.title',
        tasks: [
            {
                type: 'auth',
                name: 'create',
                run: apis.auth.createSeedPhrase,
            },
        ],
        content: Intro,
        submitText: 'register.create.submitText',
        cancelText: 'register.create.cancelText',
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
        submitText: 'register.backup.submitText',
        cancelText: 'register.backup.cancelText',
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
        submitText: 'register.password.submitText',
        cancelText: 'register.password.cancelText',
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
        submitText: 'register.linkAccount.submitText',
        cancelText: 'register.linkAccount.cancelText',
    },
    {
        titleKey: 'register.confirm.title',
        content: ConfirmRegister,
        submitText: 'register.confirm.submitText',
        cancelText: 'register.confirm.cancelText',
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
];

const exisitingAccountSteps = [

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
        submitText: 'register.linkAccount.submitText',
        cancelText: 'register.linkAccount.cancelText',
    },
    {
        titleKey: 'register.confirm.title',
        content: ConfirmRegister,
        submitText: 'register.confirm.submitText',
        cancelText: 'register.confirm.cancelText',
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
];

const handleGoBack = (step) => {
    const newProps = {};
    switch (step) {
        case 3: {
            newProps.stepOffset = 2;
            break;
        }
        default:
    }

    return newProps;
};

const handleGoNext = (step) => {
    const newProps = {};
    switch (step) {
        case 0:
            newProps.seedPhrase = KeyStore.generateRandomSeed(Date.now().toString());
            break;
        default:
    }

    return newProps;
};

const handleOnStep = (step) => {
    let newProps = {};
    switch (step) {
        case 4:
            newProps = {
            };
            break;
        default:
    }

    return newProps;
};


const Register = ({
    actionId,
    currentAccount,
    initialStep,
    initialData,
}) => {
    const hasAccount = (currentAccount && !currentAccount.linkedPublicKey);
    const steps = hasAccount ? newAccountSteps
        : exisitingAccountSteps;
    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={{
                ...initialData,
                address: currentAccount.address,
            }}
            onGoBack={handleGoBack}
            onExit={returnAndClose}
            onGoNext={handleGoNext}
            onStep={handleOnStep}
        />
    );
};

Register.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

Register.defaultProps = {
    actionId: '',
    initialStep: 0,
    initialData: {},
};

export default Register;
