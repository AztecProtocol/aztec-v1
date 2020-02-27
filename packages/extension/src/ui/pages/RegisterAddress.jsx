import React from 'react';
import PropTypes from 'prop-types';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';
import apis from '~uiModules/apis';

const RegisterAddress = ({
    currentAccount,
}) => {
    const fetchInitialData = async () => {
        const gsnConfig = await getGSNConfig();
        const {
            isGSNAvailable,
        } = gsnConfig;
        const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'].slice(1);

        const {
            keyStore,
            pwDerivedKey,
            AZTECaddress,
        } = await apis.auth.getAccountKeys();

        return {
            ...currentAccount,
            steps,
            retryWithMetaMaskStep: registerSteps.metamask.slice(-1)[0],
            keyStore,
            pwDerivedKey,
            AZTECaddress,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            testId="steps-register-address"
            fetchInitialData={fetchInitialData}
            Content={RegisterContent}
        />
    );
};

RegisterAddress.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
};

export default RegisterAddress;
