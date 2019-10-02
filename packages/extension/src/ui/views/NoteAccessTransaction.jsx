import React from 'react';
import PropTypes from 'prop-types';
import formatAddress from '~ui/utils/formatAddress';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import Connection from '~ui/components/Connection';
import Transaction from './handlers/Transaction';

const steps = [
    {
        titleKey: 'transaction.step.create.proof',
        tasks: [
            {
                name: 'proof',
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.approve',
        tasks: [
            {
                name: 'approve',
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.confirmed',
    },
];

const NoteAccessTransaction = ({
    note,
    accounts,
    initialStep,
    initialTask,
    autoStart,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        hash,
        asset,
    } = note;
    const {
        code,
    } = asset;
    const [firstUser, ...restUsers] = accounts;
    const moreItems = restUsers.map(({ address }) => formatAddress(address, 6, 4));

    const ticketHeader = (
        <Connection
            theme="white"
            from={{
                type: 'asset',
                src: asset.icon,
                alt: code,
                description: formatAddress(hash, 6, 4),
            }}
            to={{
                type: 'user',
                description: formatAddress(firstUser.address, 6, 4),
                moreItems,
            }}
            size="s"
            actionIconName="policy"
        />
    );

    const initialData = {
        note,
        accounts,
    };

    return (
        <Transaction
            title={i18n.t('note.access.grant.title')}
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

NoteAccessTransaction.propTypes = {
    note: PropTypes.shape({
        hash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: PropTypes.shape({
            address: PropTypes.string.isRequired,
            code: PropTypes.string,
            icon: PropTypes.string,
        }).isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

NoteAccessTransaction.defaultProps = {
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goBack: null,
    onClose: null,
};

export default NoteAccessTransaction;
