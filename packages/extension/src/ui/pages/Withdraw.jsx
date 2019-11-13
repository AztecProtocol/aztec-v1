import React from 'react';
import PropTypes from 'prop-types';
import {
    proofs,
} from '@aztec/dev-utils';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import WithdrawConfirm from '~ui/views/WithdrawConfirm';
import WithdrawSign from '~ui/views/WithdrawSign';
import returnAndClose from '~ui/helpers/returnAndClose';
import TransactionSend from '~ui/views/TransactionSend';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import apis from '~uiModules/apis';

const steps = [
    {
        titleKey: 'withdraw.confirm.title',
        submitTextKey: 'withdraw.confirm.submit',
        content: WithdrawConfirm,
        tasks: [
            {
                name: 'proof',
                run: apis.proof.withdraw,
            },
        ],
    },
    {
        titleKey: 'withdraw.notes.title',
        submitTextKey: 'withdraw.notes.submit',
        content: WithdrawSign,
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.note.signNotes,
            },
        ],
    },
    {
        titleKey: 'withdraw.send.title',
        submitTextKey: 'withdraw.send.submit',
        content: TransactionSend,
        contentProps: {
            descriptionKey: 'withdraw.send.explain',
        },
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
    },
];

const Withdraw = ({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
    numberOfOutputNotes,
    currentAccount,
}) => {
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);

        return {
            asset,
            sender,
            to: sender,
            transactions,
            numberOfInputNotes,
        };
    };


    return (
        <AnimatedTransaction
            steps={steps}
            fetchInitialData={fetchInitialData}
            initialData={
                {
                    assetAddress,
                    publicOwner: currentAccount.address,
                    transactions,
                    sender,
                    numberOfOutputNotes,
                    proofId: proofs.JOIN_SPLIT_PROOF,
                }
            }
            onExit={returnAndClose}
        />
    );
};

Withdraw.propTypes = {
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfInputNotes: PropTypes.number,
};

Withdraw.defaultProps = {
    numberOfInputNotes: emptyIntValue,
};

export default Withdraw;
