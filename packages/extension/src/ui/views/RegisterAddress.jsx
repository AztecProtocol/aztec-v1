import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import AddressRow from '~ui/components/AddressRow';
import apis from '~uiModules/apis';
import Transaction from './handlers/Transaction';

const registerAddressSteps = [
    {
        titleKey: 'register.address.step.link',
        tasks: [
            {
                name: 'link',
                type: 'sign',
                run: apis.auth.linkAccountToMetaMask,
            },
        ],
    },
    {
        titleKey: 'register.address.step.authorise',
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

const stepsForExistingAccount = [
    {
        titleKey: 'register.address.step.validate',
        tasks: [
            {
                name: 'get',
                run: apis.auth.getAccountKeys,
            },
        ],
    },
    ...registerAddressSteps,
    {
        titleKey: 'transaction.step.confirmed',
    },
];

const stepsForNewAccount = [
    {
        titleKey: 'register.extension.step.create',
        tasks: [
            {
                name: 'pwDerivedKey',
                run: apis.auth.createPwDerivedKey,
            },
            {
                name: 'keyvault',
                run: apis.auth.createKeyVault,
            },
            {
                name: 'register_extension',
                run: apis.auth.registerExtension,
            },
        ],
    },
    ...registerAddressSteps,
    {
        titleKey: 'register.extension.step.register',
    },
];

const RegisterAddress = ({
    title,
    description,
    submitButtonText,
    successMessage,
    seedPhrase,
    password,
    address,
    initialStep,
    initialTask,
    autoStart,
    goNext,
    goBack,
    onClose,
}) => {
    const isNewExtensionAccount = !!(seedPhrase && password);
    const steps = isNewExtensionAccount
        ? stepsForNewAccount
        : stepsForExistingAccount;

    const ticketHeader = (
        <div>
            <Block bottom="l">
                <Text
                    text={i18n.t('register.link.account')}
                    color="primary"
                />
            </Block>
            <Block padding="xs 0">
                <AddressRow
                    address={address}
                    size="xs"
                    prefixLength={10}
                    suffixLength={8}
                />
            </Block>
        </div>
    );

    const initialData = {
        seedPhrase,
        password,
        address,
    };

    return (
        <Transaction
            title={title || i18n.t('register.address.title')}
            description={description || i18n.t('register.address.description')}
            ticketHeader={ticketHeader}
            steps={steps}
            initialStep={initialStep}
            initialTask={initialTask}
            initialData={initialData}
            submitButtonText={submitButtonText || i18n.t('register.address')}
            successMessage={successMessage || i18n.t('register.address.complete')}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
            autoStart={autoStart}
        />
    );
};

RegisterAddress.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    submitButtonText: PropTypes.string,
    successMessage: PropTypes.string,
    seedPhrase: PropTypes.string,
    password: PropTypes.string,
    address: PropTypes.string.isRequired,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

RegisterAddress.defaultProps = {
    title: '',
    description: '',
    submitButtonText: '',
    successMessage: '',
    seedPhrase: '',
    password: '',
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goBack: null,
    onClose: null,
};

export default RegisterAddress;
