import React from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import RestoreFromSeedPhrase from '~/ui/views/RestoreFromSeedPhrase';
import CreatePassword from '~/ui/views/CreatePassword';

const steps = [
    {
        titleKey: 'account.restore.title',
        content: RestoreFromSeedPhrase,
        submitTextKey: 'account.restore.submit',
        onSubmit: ({ seedPhrase }) => {
            const phrases = seedPhrase
                .replace(/\s{1,}/g, ' ')
                .trim()
                .split(' ')
                .filter(p => p);

            let errorKey;
            if (!phrases.length) {
                errorKey = 'account.restore.error.seedPhrase.empty';
            } else if (phrases.length !== 12) {
                errorKey = 'account.restore.error.seedPhrase';
            }

            return !errorKey
                ? {
                    seedPhrase: phrases.join(' '),
                }
                : {
                    error: {
                        key: errorKey,
                    },
                };
        },
        tasks: [
            {
                name: 'generate',
                run: apis.auth.generateLinkedPublicKey,
            },
        ],
        onGoNext: ({
            currentAccount,
            linkedPublicKey,
        }) => {
            if (linkedPublicKey !== currentAccount.linkedPublicKey) {
                return {
                    error: {
                        key: 'account.restore.failed.seedPhrase',
                    },
                };
            }
            return null;
        },
    },
    {
        titleKey: 'register.password.title',
        tasks: [
            {
                name: 'restore',
                run: apis.auth.restoreAccount,
            },
        ],
        content: CreatePassword,
        submitTextKey: 'register.password.submit',
        onSubmit: ({ password }) => {
            if (!password || !password.trim()) {
                return {
                    error: {
                        key: 'account.password.error.empty',
                    },
                };
            }
            return null;
        },
    },
];

const Restore = ({
    initialStep,
    currentAccount,
}) => (
    <AnimatedTransaction
        initialStep={initialStep}
        steps={steps}
        initialData={{
            currentAccount,
            address: currentAccount.address,
        }}
    />
);

Restore.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
};

Restore.defaultProps = {
    initialStep: 0,
};

export default Restore;
