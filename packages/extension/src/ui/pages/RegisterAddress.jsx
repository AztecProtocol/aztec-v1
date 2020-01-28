import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/config/steps';
import apis from '~uiModules/apis';

const RegisterAddress = ({
    currentAccount,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'].slice(1);

    const fetchInitialData = async () => {
        const {
            keyStore,
            pwDerivedKey,
        } = await apis.auth.getAccountKeys();

        return {
            ...currentAccount,
            keyStore,
            pwDerivedKey,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            steps={steps}
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
    gsnConfig: gsnConfigShape.isRequired,
};

export default RegisterAddress;
