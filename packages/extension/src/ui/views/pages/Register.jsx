import React from 'react';
import PropTypes from 'prop-types';
import { KeyStore } from '~utils/keyvault';
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

const Register = ({
    address,
}) => (
    <CombinedViews
        Steps={Steps}
        initialData={{
            address,
        }}
        onGoBack={handleGoBack}
        onGoNext={handleGoNext}
        autoClose
    />
);

Register.propTypes = {
    address: PropTypes.string.isRequired,
};

export default Register;
