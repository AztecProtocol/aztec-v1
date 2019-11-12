import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import i18n from '~ui/helpers/i18n';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import RestoreFromSeedPhrase from '~ui/views/RestoreFromSeedPhrase';
import CreatePassword from '~ui/views/CreatePassword';
import Loading from '~ui/views/Loading';
import RestoreFailed from '~ui/views/RestoreFailed';
import RegisterAddressTransaction from '~ui/views/RegisterAddressTransaction';

const Steps = [
    RestoreFromSeedPhrase,
    CreatePassword,
    Loading,
    RestoreFailed,
    RegisterAddressTransaction,
];

const steps = [
    {
        titleKey: 'account.restore.title',
        tasks: [
        ],
        content: RestoreFromSeedPhrase,
        submitText: 'account.restore.submitText',
        cancelText: 'account.restore.cancelText',
    },
    {
        titleKey: 'register.password.title',
        tasks: [
            {
                name: 'restore',
                run: async (

                    {
                        address,
                        seedPhrase,
                        password,
                    },
                ) => {
                    const {
                        duplicated,
                    } = await apis.account.checkDuplicates({
                        address,
                        seedPhrase,
                        password,
                    });
                    let linkedPublicKey;
                    if (!duplicated) {
                        ({
                            linkedPublicKey,
                        } = await apis.auth.restoreAccount({
                            address,
                            seedPhrase,
                            password,
                        }));
                    }
                    return {
                        duplicated,
                        linkedPublicKey,
                    };
                },
            },
        ],
        content: CreatePassword,
        submitText: 'register.password.submitText',
        cancelText: 'register.password.cancelText',
    },
];

const handleOnStep = (step, prevData) => {
    const newProps = {};
    switch (step) {
        case 0:
            break;
        case 1:
            break;
        case 2: {
            break;
        }
        case 4:
            break;
        default:
    }
    return newProps;
};

const Restore = ({
    actionId,
    currentAccount,
}) => {
    const initialData = {
        address: currentAccount.address,
        isLinked: !!currentAccount.linkedPublicKey,
    };

    return (

        <AnimatedTransaction
            steps={steps}
            initialData={initialData}
            onExit={returnAndClose}
            onStep={handleOnStep}
        />
    );
};

Restore.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
};

Restore.defaultProps = {
    actionId: '',
};

export default Restore;
