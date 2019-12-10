import React from 'react';
import PropTypes from 'prop-types';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';
import { linkAccountSteps } from '~ui/config/steps';


const RegisterAddress = ({
    currentAccount,
    initialStep,
    initialData,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? linkAccountSteps.gsn : linkAccountSteps.metamask;
    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={{
                ...initialData,
                ...currentAccount,
            }}
        />
    );
};
RegisterAddress.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    gsnConfig: gsnConfigShape.isRequired,
};

RegisterAddress.defaultProps = {
    initialStep: 0,
    initialData: {},
};

export default RegisterAddress;
