import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';

const Register = ({
    currentAccount,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const {
        address,
    } = currentAccount;
    const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    return (
        <StepsHandler
            steps={steps}
            initialData={{
                address,
                isGSNAvailable,
            }}
            Content={RegisterContent}
        />
    );
};

Register.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    gsnConfig: gsnConfigShape.isRequired,
};

export default Register;
