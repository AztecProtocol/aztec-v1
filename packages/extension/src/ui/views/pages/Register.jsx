import React from 'react';
import PropTypes from 'prop-types';
import { KeyStore } from '~utils/keyvault';
import i18n from '~ui/helpers/i18n';
import returnAndClose from '~ui/helpers/returnAndClose';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import Intro from '~ui/views/RegisterIntro';
import BackupKeys from '~ui/views/BackupKeys';
import ConfirmBackupKeys from '~ui/views/ConfirmBackupKeys';
import CreatePassword from '~ui/views/CreatePassword';
import RegisterAddress from '~ui/views/RegisterAddress';

const Steps = [
    Intro,
    BackupKeys,
    ConfirmBackupKeys,
    CreatePassword,
    RegisterAddress,
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
}) => (
    <CombinedViews
        Steps={Steps}
        initialStep={initialStep}
        initialData={{
            ...initialData,
            address: currentAccount.address,
        }}
        onGoBack={handleGoBack}
        onGoNext={handleGoNext}
        onStep={handleOnStep}
        onExit={actionId ? returnAndClose : () => goToPage('account')}
    />
);

Register.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    goToPage: PropTypes.func.isRequired,
};

Register.defaultProps = {
    actionId: '',
    initialStep: 0,
    initialData: {},
};

export default Register;
