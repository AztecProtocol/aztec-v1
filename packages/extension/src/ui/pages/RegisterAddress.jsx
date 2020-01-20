import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import { linkAccountSteps } from '~/ui/config/steps';

const RegisterAddress = ({
    currentAccount,
    initialStep,
    initialData,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = linkAccountSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={{
                ...initialData,
                ...currentAccount,
                isGSNAvailable,
            }}
        />
    );
};

RegisterAddress.propTypes = {
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    gsnConfig: gsnConfigShape.isRequired,
};

RegisterAddress.defaultProps = {
    initialStep: 0,
    initialData: {},
};

export default RegisterAddress;
