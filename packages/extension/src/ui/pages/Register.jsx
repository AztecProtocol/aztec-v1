import React from 'react';
import PropTypes from 'prop-types';
import i18n from '~/ui/helpers/i18n';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import RegisterIntro from '~ui/views/RegisterIntro';
import BackupKeys from '~ui/views/BackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import LinkAccount from '~ui/views/LinkAccount';
import RegisterConfirm from '~ui/views/RegisterConfirm';
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
                    message: i18n.t('account.password.error.empty'),
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
];

const Register = ({
    currentAccount,
    initialStep,
    initialData,
}) => {
    const steps = !currentAccount.linkedPublicKey
        ? newAccountSteps
        : exisitingAccountSteps;

    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={{
                ...initialData,
                ...currentAccount,
            }}
        />
    );
};

Register.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

Register.defaultProps = {
    initialStep: 0,
    initialData: {},
};

export default Register;
