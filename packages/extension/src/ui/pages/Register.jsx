import React from 'react';
import PropTypes from 'prop-types';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';

import { registerSteps } from '~ui/config/steps';


const Register = ({
    initialStep,
    currentAccount: {
        address,
    },
    linkedPublicKey,
    seedPhrase,
    gsnConfig,
}) => {
    const initialData = {
        address,
        linkedPublicKey,
        seedPhrase,
    };
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? registerSteps.gsn : registerSteps.metamask;

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
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    linkedPublicKey: PropTypes.string,
    seedPhrase: PropTypes.string,
};

Register.defaultProps = {
    initialStep: 0,
    linkedPublicKey: '',
    seedPhrase: '',
};

export default Register;
