import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';
import {
    getNetworkName,
} from '~/utils/network';
import Web3Service from '~/helpers/Web3Service';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { linkAccountSteps } from '~ui/config/steps';

const RegisterAddress = ({
    currentAccount,
    linkedPublicKey,
    initialStep,
    initialData,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    // send via gsn will not work if there is no linkedPublicKey on chain when using ganache
    const steps = isGSNAvailable
        && (getNetworkName(Web3Service.networkId) !== 'ganache' || linkedPublicKey)
        ? linkAccountSteps.gsn
        : linkAccountSteps.metamask;

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
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    linkedPublicKey: PropTypes.string,
    gsnConfig: gsnConfigShape.isRequired,
};

RegisterAddress.defaultProps = {
    initialStep: 0,
    initialData: {},
    linkedPublicKey: '',
};

export default RegisterAddress;
