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

const Register = ({
    currentAccount,
    domainRegistered,
    gsnConfig,
    goToPage,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const {
        address,
    } = currentAccount;
    const steps = registerSteps[isGSNAvailable ? 'gsn' : 'metamask'];

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
            initialData={{
                address,
                isGSNAvailable,
            }}
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
    gsnConfig: gsnConfigShape.isRequired,
    goToPage: PropTypes.func.isRequired,
};

export default Register;
