import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import apis from '~uiModules/apis';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import DepositConfirm from '~ui/views/DepositConfirm';
import DepositApprove from '~ui/views/DepositApprove';
import TransactionSend from '~ui/views/TransactionSend';

const steps = [
    {
        titleKey: 'deposit.confirm.title',
        tasks: [
            {
                name: 'proof',
                run: apis.proof.deposit,
            },
        ],
        content: DepositConfirm,
        submitTextKey: 'deposit.confirm.submit',
    },
    {
        titleKey: 'deposit.approve.title',
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.ace.publicApprove,
            },
        ],
        content: DepositApprove,
        submitTextKey: 'deposit.approve.submit',
    },
    {
        titleKey: 'deposit.send.title',
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
        content: TransactionSend,
        contentProps: {
            descriptionKey: 'deposit.send.explain',
        },
        submitTextKey: 'deposit.send.submit',
    },
];

const gsnSteps = [
    {
        titleKey: 'deposit.confirm.title',
        tasks: [
            {
                name: 'proof',
                run: apis.proof.deposit,
            },
        ],
        content: DepositConfirm,
        submitText: 'deposit.confirm.submitText',
        cancelText: 'deposit.confirm.cancelText',
    },
    {
        titleKey: 'deposit.approve.title',
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.ace.publicApprove,
            },
        ],
        content: DepositApprove,
        submitText: 'deposit.approve.submitText',
        cancelText: 'deposit.approve.cancelText',
    },
    {
        titleKey: 'deposit.send.title',
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransferFrom,
            },
        ],
        content: DepositSend,
        submitText: 'deposit.send.submitText',
        cancelText: 'deposit.send.cancelText',
    },
];

const handleOnStep = (step) => {
    const newProps = {};
    switch (step) {
        case 1:
            break;
        default:
    }

    return newProps;
};

const Deposit = ({
    initialStep,
    from,
    sender,
    assetAddress,
    transactions,
    numberOfOutputNotes,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? gsnSteps : metamaskSteps;
    const actualSender = isGSNAvailable ? proxyContract : sender;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const amount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            asset,
            from,
            sender: actualSender,
            amount,
            transactions,
            numberOfOutputNotes,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
            initialData={
                {
                    assetAddress,
                    owner: from,
                    publicOwner: from,
                    transactions,
                    sender: actualSender,
                    numberOfOutputNotes,
                }
            }
            onExit={returnAndClose}
            onStep={handleOnStep}
        />
    );
};

Deposit.propTypes = {
    initialStep: PropTypes.number,
    from: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    assetAddress: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfOutputNotes: PropTypes.number,
    gsnConfig: gsnConfigShape.isRequired,
};

Deposit.defaultProps = {
    initialStep: 0,
    numberOfOutputNotes: emptyIntValue,
};

export default Deposit;
