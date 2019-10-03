import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    defaultInt,
} from '~ui/config/settings';
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
    to,
    amount,
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
    } = asset;

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
                    type: 'asset',
                    src: asset.icon,
                    alt: code,
                    description: formatAddress(assetAddress, 6, 4),
                }}
                to={{
                    type: 'user',
                    description: formatAddress(to, 6, 4),
                }}
                size="s"
                actionIconName="double_arrow"
            />
        </div>
    );

    const initialData = {
        assetAddress: asset.address,
        sender,
        to,
        amount,
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
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
        icon: PropTypes.string,
    }).isRequired,
    sender: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    numberOfInputNotes: PropTypes.number,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

WithdrawTransaction.defaultProps = {
    numberOfInputNotes: defaultInt,
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default WithdrawTransaction;
