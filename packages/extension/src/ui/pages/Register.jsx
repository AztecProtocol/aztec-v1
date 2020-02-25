import React from 'react';
import PropTypes from 'prop-types';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';

const Register = ({
    currentAccount,
}) => {
    const fetchInitialData = async () => {
        const gsnConfig = await getGSNConfig();
        const {
            isGSNAvailable,
        } = gsnConfig;
        const {
            address,
        } = currentAccount;
        const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'];

        return {
            steps,
            retryWithMetaMaskStep: registerSteps.metamask.slice(-1)[0],
            address,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            testId="steps-register"
            fetchInitialData={fetchInitialData}
            Content={RegisterContent}
        />
    );
};

Register.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
};

export default Register;
