import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { registerSteps } from '~ui/config/steps';

const Register = ({
    initialStep,
    currentAccount,
    seedPhrase,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={{
                ...currentAccount,
                seedPhrase,
            }}
        />
    );
};

Register.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    seedPhrase: PropTypes.string,
    gsnConfig: gsnConfigShape.isRequired,
};

Register.defaultProps = {
    initialStep: 0,
    seedPhrase: '',
};

export default Register;
