import React from 'react';
import PropTypes from 'prop-types';
import { KeyStore } from '~utils/keyvault';
import i18n from '~ui/helpers/i18n';
import returnAndClose from '~ui/helpers/returnAndClose';
import {
    siteShape,
} from '~/ui/config/propTypes';
import Popup from '~ui/components/Popup';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import Intro from '~ui/views/RegisterIntro';
import BackupKeys from '~ui/views/BackupKeys';
// import ConfirmBackupKeys from '~ui/views/ConfirmBackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import apis from '~uiModules/apis';
// import RegisterAddressTransaction from '~ui/views/RegisterAddressTransaction';

const Steps = [
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
                run: apis.auth.backupKeys,
            },
        ],
        content: BackupKeys,
        submitText: 'register.backup.submitText',
        cancelText: 'register.backup.cancelText',
    },
    {
        titleKey: 'register.password',
        tasks: [
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
    // RegisterAddressTransaction,
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
                description: i18n.t('register.extension.description'),
                submitButtonText: i18n.t('register.create.account'),
                successMessage: i18n.t('register.extension.step.completed'),
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
    goToPage,
    autoStart,
    goNext,
    goBack,
    onClose,
}) => (
    <Popup site={site}>
        <AnimatedTransaction
            steps={Steps}
            initialStep={initialStep}
            initialData={{
                ...initialData,
                address: currentAccount.address,
            }}
            onGoBack={handleGoBack}
            onGoNext={handleGoNext}
            onStep={handleOnStep}
            onExit={actionId ? returnAndClose : () => goToPage('account')}
            successMessage={i18n.t('transaction.success')}
            autoStart={autoStart}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
        />
    </Popup>
);

Register.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    goToPage: PropTypes.func.isRequired,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Register.defaultProps = {
    actionId: '',
    initialStep: 0,
    initialData: {},
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default Register;
