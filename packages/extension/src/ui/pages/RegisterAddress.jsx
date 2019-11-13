import React from 'react';
import PropTypes from 'prop-types';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction/index';
import LinkAccount from '~ui/views/LinkAccount';
import RegisterConfirm from '~ui/views/RegisterConfirm';
import apis from '~uiModules/apis';

const steps = [
    {
        titleKey: 'register.linkAccount.title',
        tasks: [
            {
                name: 'get',
                run: apis.auth.getAccountKeys,
            },
            {
                name: 'link',
                type: 'sign',
                run: apis.auth.linkAccountToMetaMask,
            },
        ],
        content: LinkAccount,
        submitTextKey: 'register.linkAccount.submit',
    },
    {
        titleKey: 'register.confirm.title',
        content: RegisterConfirm,
        submitTextKey: 'register.confirm.submit',
        tasks: [
            {
                name: 'authorise',
                run: apis.auth.sendRegisterAddress,
            },
            {
                name: 'register_address',
                run: apis.auth.registerAddress,
            },
        ],
    },
];

const RegisterAddress = ({
    currentAccount,
    initialStep,
    initialData,
}) => (
    <AnimatedTransaction
        steps={steps}
        initialStep={initialStep}
        initialData={{
            ...initialData,
            ...currentAccount,
        }}
    />
);

RegisterAddress.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string.isRequired,
    }).isRequired,
    initialStep: PropTypes.number,
    initialData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

RegisterAddress.defaultProps = {
    initialStep: 0,
    initialData: {},
};

export default RegisterAddress;
