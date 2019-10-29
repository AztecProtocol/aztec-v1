import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import ListItem from '~ui/components/ListItem';
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
                run: apis.auth.createKeyStore,
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

const RegisterAddressTransaction = ({
    title,
    description,
    submitButtonText,
    successMessage,
    seedPhrase,
    password,
    address,
    initialStep,
    initialTask,
    linkedPublicKey,
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
                <ListItem
                    profile={{
                        type: 'user',
                        address,
                    }}
                    content={formatAddress(address, 10, 8)}
                    size="xs"
                />
            </Block>
        </div>
    );

    const initialData = {
        seedPhrase,
        linkedPublicKey,
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

RegisterAddressTransaction.propTypes = {
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

RegisterAddressTransaction.defaultProps = {
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

export default RegisterAddressTransaction;
