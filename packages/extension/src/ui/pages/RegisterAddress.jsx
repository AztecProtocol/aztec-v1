import React from 'react';
import PropTypes from 'prop-types';
import ConnectionService from '~/ui/services/ConnectionService';
import returnAndClose from '~/ui/helpers/returnAndClose';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import RegisterContent from '~/ui/views/RegisterContent';
import registerSteps from '~/ui/steps/register';
import apis from '~uiModules/apis';

const RegisterAddress = ({
    currentAccount,
    domainRegistered,
    goToPage,
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
    goToPage: PropTypes.func.isRequired,
};

export default RegisterAddress;
