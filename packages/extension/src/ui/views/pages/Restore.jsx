import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import i18n from '~ui/helpers/i18n';
import returnAndClose from '~ui/helpers/returnAndClose';
import CombinedViews from '~ui/views/handlers/CombinedViews';
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

const handleOnStep = (step, prevData) => {
    let newProps = {};
    switch (step) {
        case 0:
            newProps = {
                submitButtonText: i18n.t('next'),
            };
            break;
        case 1:
            newProps = {
                description: i18n.t('account.restore.password.description'),
                submitButtonText: i18n.t('account.restore.confirm'),
            };
            break;
        case 2: {
            const {
                address,
                seedPhrase,
                password,
            } = prevData;
            newProps = {
                message: i18n.t('account.restore.processing'),
                onStart: async () => {
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
            };
            break;
        }
        case 4:
            newProps = {
                title: i18n.t('account.restore'),
                description: i18n.t('account.restore.processing.description'),
                successMessage: i18n.t('account.restore.complete'),
                autoStart: true,
            };
            break;
        default:
    }
    return newProps;
};

const Restore = ({
    actionId,
    currentAccount,
    goToPage,
}) => {
    const [retry, updateRetry] = useState(0);

    const handleGoNext = (currentStep, data) => {
        const newProps = {};
        switch (currentStep) {
            case 2: {
                const {
                    duplicated,
                    linkedPublicKey,
                } = data;
                if (linkedPublicKey) {
                    if (actionId) {
                        returnAndClose(data);
                    } else {
                        goToPage('account');
                    }
                    return {
                        redirect: true,
                    };
                }
                if (!duplicated) {
                    newProps.stepOffset = 2;
                }
                break;
            }
            case 3:
                updateRetry(retry + 1);
                return {
                    redirect: true,
                };
            default:
        }

        return newProps;
    };

    const initialData = {
        address: currentAccount.address,
        isLinked: !!currentAccount.linkedPublicKey,
    };

    return (
        <CombinedViews
            Steps={Steps}
            initialData={initialData}
            onStep={handleOnStep}
            onGoNext={handleGoNext}
            onExit={actionId ? returnAndClose : () => goToPage('account')}
            retry={retry}
        />
    );
};

Restore.propTypes = {
    actionId: PropTypes.string,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
        linkedPublicKey: PropTypes.string,
    }).isRequired,
    goToPage: PropTypes.func.isRequired,
};

Restore.defaultProps = {
    actionId: '',
};

export default Restore;
