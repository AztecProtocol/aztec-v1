import React from 'react';
import PropTypes from 'prop-types';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import RegisterIntro from '~ui/views/RegisterIntro';
import BackupKeys from '~ui/views/BackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import LinkAccount from '~ui/views/LinkAccount';
import RegisterConfirm from '~ui/views/RegisterConfirm';
import apis from '~uiModules/apis';

const steps = [
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
];

const Register = ({
    initialStep,
    address,
    linkedPublicKey,
    seedPhrase,
}) => {
    const initialData = {
        address,
        linkedPublicKey,
        seedPhrase,
    };

    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={initialData}
        />
    );
};

Register.propTypes = {
    initialStep: PropTypes.number,
    address: PropTypes.string,
    linkedPublicKey: PropTypes.string,
    seedPhrase: PropTypes.string,
};

Register.defaultProps = {
    initialStep: 0,
    address: '',
    linkedPublicKey: '',
    seedPhrase: '',
};

export default Register;
