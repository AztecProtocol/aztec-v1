import React from 'react';
import PropTypes from 'prop-types';
import ConnectionService from '~uiModules/services/ConnectionService';
import returnAndClose from '~/ui/helpers/returnAndClose';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';

const Register = ({
    currentAccount,
    domainRegistered,
    goToPage,
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

    const handleClose = async (data) => {
        if (domainRegistered) {
            returnAndClose(data);
        } else {
            goToPage('loading');
            ConnectionService.returnToClient(data);
        }
    };

    return (
        <StepsHandler
            testId="steps-register"
            fetchInitialData={fetchInitialData}
            Content={RegisterContent}
            onExit={handleClose}
        />
    );
};

Register.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    domainRegistered: PropTypes.bool.isRequired,
    goToPage: PropTypes.func.isRequired,
};

export default Register;
