import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import ConnectionService from '~uiModules/services/ConnectionService';
import returnAndClose from '~uiModules/helpers/returnAndClose';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';
import apis from '~uiModules/apis';

const RegisterAddress = ({
    currentAccount,
    domainRegistered,
    gsnConfig,
    goToPage,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'].slice(1);

    const fetchInitialData = async () => {
        const {
            keyStore,
            pwDerivedKey,
            AZTECaddress,
        } = await apis.auth.getAccountKeys();

        return {
            ...currentAccount,
            keyStore,
            pwDerivedKey,
            AZTECaddress,
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
            steps={steps}
            fetchInitialData={fetchInitialData}
            Content={RegisterContent}
            onExit={handleClose}
        />
    );
};

RegisterAddress.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    domainRegistered: PropTypes.bool.isRequired,
    gsnConfig: gsnConfigShape.isRequired,
    goToPage: PropTypes.func.isRequired,
};

export default RegisterAddress;
