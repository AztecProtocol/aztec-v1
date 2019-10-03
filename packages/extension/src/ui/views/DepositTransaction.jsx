import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import Transaction from '~ui/views/handlers/Transaction';
import Connection from '~ui/components/Connection';

const steps = [
    {
        titleKey: 'transaction.step.create.proof',
        tasks: [
            {
                name: 'proof',
                run: apis.proof.deposit,
            },
        ],
    },
    {
        titleKey: 'transaction.step.approve',
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.ace.publicApprove,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
    },
    {
        titleKey: 'transaction.step.confirmed',
    },
];

const DepositTransaction = ({
    asset,
    from: fromAddress,
    transactions,
    amount,
    numberOfOutputNotes,
    initialStep,
    initialTask,
    autoStart,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        code,
        address: assetAddress,
        tokenAddress,
        icon,
    } = asset;

    const initialData = {
        assetAddress,
        owner: fromAddress,
        publicOwner: fromAddress,
        transactions,
        amount,
        numberOfOutputNotes,
    };

    const ticketHeader = (
        <div>
            <Block bottom="s">
                <Text
                    text={formatValue(code, amount)}
                    size="m"
                    color="primary"
                    weight="semibold"
                />
            </Block>
            <Connection
                theme="white"
                from={{
                    type: 'token',
                    src: icon,
                    alt: code,
                    description: formatAddress(tokenAddress, 6, 4),
                }}
                to={{
                    type: 'asset',
                    src: icon,
                    alt: code,
                    description: formatAddress(assetAddress, 6, 4),
                }}
                size="s"
                actionIconName="double_arrow"
            />
        </div>
    );

    return (
        <Transaction
            title={i18n.t('deposit.transaction')}
            description={i18n.t('deposit.transaction.description')}
            content={ticketHeader}
            ticketHeight={3}
            steps={steps}
            initialStep={initialStep}
            initialTask={initialTask}
            initialData={initialData}
            submitButtonText={i18n.t('proof.create')}
            successMessage={i18n.t('transaction.success')}
            autoStart={autoStart}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
        />
    );
};

DepositTransaction.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        tokenAddress: PropTypes.string.isRequired,
        code: PropTypes.string,
        icon: PropTypes.string,
    }).isRequired,
    from: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    amount: PropTypes.number.isRequired,
    numberOfOutputNotes: PropTypes.number,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

DepositTransaction.defaultProps = {
    numberOfOutputNotes: 0,
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default DepositTransaction;
