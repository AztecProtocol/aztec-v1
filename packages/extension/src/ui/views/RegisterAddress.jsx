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
        titleKey: 'register.address.step.authorise',
        tasks: [
            {
                name: 'authorise',
                run: apis.sendRegisterAddress,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.registerAccount,
            },
        ],
    },
];

const stepsForExistingAccount = [
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
                name: 'create',
                run: apis.createKeyVault,
            },
            {
                name: 'link',
                run: apis.linkAccountToMetaMask,
            },
        ],
    },
    ...registerAddressSteps,
    {
        titleKey: 'register.extension.step.register',
    },
];

const RegisterAddress = ({
    requestId,
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
        requestId,
        seedPhrase,
        password,
        address,
    };

    return (
        <Transaction
            title={i18n.t('register.address.title')}
            description={i18n.t(isNewExtensionAccount
                ? 'register.extension.description'
                : 'register.address.description')}
            ticketHeader={ticketHeader}
            steps={steps}
            initialStep={initialStep}
            initialTask={initialTask}
            initialData={initialData}
            submitButtonText={i18n.t(isNewExtensionAccount
                ? 'register.create.account'
                : 'proof.create')}
            successMessage={i18n.t(isNewExtensionAccount
                ? 'register.extension.step.completed'
                : 'transaction.success')}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
            autoStart={autoStart}
        />
    );
};

RegisterAddress.propTypes = {
    requestId: PropTypes.string.isRequired,
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
    seedPhrase: '',
    password: '',
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goBack: null,
    onClose: null,
};

export default RegisterAddress;
