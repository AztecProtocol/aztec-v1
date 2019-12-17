import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
} from '~/ui/config/propTypes';
import {
    getNetworkName,
} from '~/utils/network';
import Web3Service from '~/helpers/Web3Service';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { registerSteps } from '~ui/config/steps';

const Register = ({
    initialStep,
    currentAccount: {
        address,
    },
    linkedPublicKey,
    seedPhrase,
    gsnConfig,
}) => {
    const initialData = {
        address,
        linkedPublicKey,
        seedPhrase,
    };
    const {
        isGSNAvailable,
    } = gsnConfig;
    // register via gsn will not work if there is no linkedPublicKey on chain when using ganache
    const steps = isGSNAvailable
        && (getNetworkName(Web3Service.networkId) !== 'ganache' || linkedPublicKey)
        ? registerSteps.gsn
        : registerSteps.metamask;

    return (
        <AnimatedTransaction
            steps={steps}
            initialStep={initialStep}
            initialData={initialData}
        />
    );
};

Register.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    linkedPublicKey: PropTypes.string,
    seedPhrase: PropTypes.string,
    gsnConfig: gsnConfigShape.isRequired,
};

Register.defaultProps = {
    initialStep: 0,
    linkedPublicKey: '',
    seedPhrase: '',
};

export default Register;
