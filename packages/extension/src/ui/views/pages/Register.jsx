import React from 'react';
import { KeyStore } from '~utils/keyvault';
import ActionService from '~ui/services/ActionService';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import Intro from '../RegisterIntro';
import BackupKeys from '../BackupKeys';
import ConfirmBackupKeys from '../ConfirmBackupKeys';

const Steps = [
    Intro,
    BackupKeys,
    ConfirmBackupKeys,
];

const handleGoBack = (step, prevData) => {
    let data = prevData;
    switch (step) {
        case 0: {
            data = { ...data };
            delete data.seedPhrase;
            break;
        }
        default:
    }

    return data;
};

const handleGoNext = (step, prevData) => {
    let data = prevData;
    switch (step) {
        case 0: {
            data = {
                ...data,
                seedPhrase: KeyStore.generateRandomSeed(Date.now().toString()),
            };
            break;
        }
        default:
    }

    return data;
};

const handleResponse = (response) => {
    console.log('Register successfully!', response);
};

const doRegister = (data) => {
    const {
        seedPhrase,
    } = data;
    ActionService
        .post('register', { seedPhrase })
        .onReceiveResponse(handleResponse);
};

const Register = () => (
    <CombinedViews
        Steps={Steps}
        onGoBack={handleGoBack}
        onGoNext={handleGoNext}
        onExit={doRegister}
    />
);

export default Register;
