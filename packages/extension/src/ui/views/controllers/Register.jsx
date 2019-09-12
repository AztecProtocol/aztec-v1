import React, {
    PureComponent,
} from 'react';
import { KeyStore } from '~utils/keyvault';
import ActionService from '~ui/services/ActionService';
import Intro from '../RegisterIntro';
import BackupKeys from '../BackupKeys';
import ConfirmBackupKeys from '../ConfirmBackupKeys';

const Steps = [
    Intro,
    BackupKeys,
    ConfirmBackupKeys,
];

class Register extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            step: 0,
            seedPhrase: '',
        };
    }

    handleGoBack = () => {
        const {
            step,
        } = this.state;
        const nextState = {};
        switch (step) {
            case 0: {
                nextState.seedPhrase = '';
                break;
            }
            default:
        }

        this.setState({
            ...nextState,
            step: step - 1,
        });
    };

    handleGoNext = (childState = {}) => {
        const {
            step,
        } = this.state;
        const nextState = { ...childState };
        switch (step) {
            case 0: {
                const seedPhrase = KeyStore.generateRandomSeed(Date.now().toString());
                nextState.seedPhrase = seedPhrase;
                break;
            }
            default:
        }

        if (step === Steps.length - 1) {
            this.doRegister();
            return;
        }

        this.setState({
            ...nextState,
            step: step + 1,
        });
    };

    handleResponse = (response) => {
        console.log('Register handleResponse', response);
    };

    doRegister() {
        const {
            seedPhrase,
        } = this.state;
        ActionService
            .post('register', { seedPhrase })
            .onReceiveResponse(this.handleResponse);
    }

    render() {
        const {
            step,
            seedPhrase,
        } = this.state;
        const Step = Steps[step];

        return (
            <Step
                seedPhrase={seedPhrase}
                goBack={step > 0 ? this.handleGoBack : null}
                goNext={this.handleGoNext}
            />
        );
    }
}

export default Register;
