import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
} from '~ui/config/propTypes';
import {
    emptyIntValue,
} from '~ui/config/settings';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import Transaction from '~ui/views/handlers/Transaction';
import Connection from '~ui/components/Connection';
import ListItem from '~ui/components/ListItem';

const steps = [
    {
        titleKey: 'transaction.step.create.proof',
        tasks: [
            {
                name: 'proof',
                run: apis.proof.withdraw,
            },
        ],
    },
    {
        titleKey: 'transaction.step.approve',
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.note.signNotes,
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

const WithdrawTransaction = ({
    asset,
    sender,
    transactions,
    numberOfInputNotes,
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
        linkedTokenAddress,
    } = asset;
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const [firstTransaction, ...rest] = transactions;
    const moreItems = rest.map(({
        amount,
        to,
    }, i) => (
        <ListItem
            key={+i}
            profile={{
                type: 'user',
                address: to,
            }}
            content={formatAddress(to, 6, 4)}
            size="xxs"
            footnote={(
                <Text
                    text={`+${formatValue(asset.code, amount)}`}
                    color="green"
                />
            )}
        />
    ));

    const ticketHeader = (
        <div>
            <Block bottom="s">
                <Text
                    text={formatValue(code, totalAmount)}
                    size="m"
                    color="primary"
                    weight="semibold"
                />
            </Block>
            <Connection
                theme="white"
                from={{
                    profile: {
                        type: 'asset',
                        address: assetAddress,
                        linkedTokenAddress,
                    },
                    description: formatAddress(assetAddress, 6, 4),
                }}
                to={{
                    profile: {
                        type: 'user',
                        address: firstTransaction.to,
                    },
                    tooltip: (
                        <ListItem
                            content={formatAddress(firstTransaction.to, 6, 4)}
                            size="xxs"
                            footnote={(
                                <Text
                                    text={`+${formatValue(asset.code, firstTransaction.amount)}`}
                                    color="green"
                                />
                            )}
                        />
                    ),
                    description: formatAddress(firstTransaction.to, 6, 4),
                    moreItems,
                }}
                size="s"
                actionIconName="double_arrow"
            />
        </div>
    );

    const initialData = {
        assetAddress: asset.address,
        sender,
        transactions,
        numberOfInputNotes,
    };

    return (
        <Transaction
            title={i18n.t('withdraw.transaction')}
            description={i18n.t('withdraw.transaction.description')}
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

WithdrawTransaction.propTypes = {
    asset: assetShape.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfInputNotes: PropTypes.number,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

WithdrawTransaction.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default WithdrawTransaction;
