import React from 'react';
import PropTypes from 'prop-types';
import {
    assetShape,
} from '~ui/config/propTypes';
import formatAddress from '~ui/utils/formatAddress';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import Connection from '~ui/components/Connection';
import ListItem from '~ui/components/ListItem';
import Transaction from './handlers/Transaction';

const steps = [
    {
        titleKey: 'transaction.step.encrypt.keys',
        tasks: [
            {
                name: 'encrypt',
                run: apis.note.grantNoteAccess,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.asset.updateNoteMetadata,
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
        noteHash,
        asset,
    } = note;
    const [firstUser, ...restUsers] = accounts;

    const moreItems = restUsers.map(({ address }, i) => (
        <ListItem
            key={+i}
            profile={{
                type: 'user',
                address,
            }}
            content={formatAddress(address, 10, 6)}
            size="xxs"
        />
    ));

    const ticketHeader = (
        <Connection
            theme="white"
            from={{
                profile: {
                    ...asset,
                    type: 'asset',
                },
                description: formatAddress(noteHash, 6, 4),
            }}
            to={{
                profile: {
                    type: 'user',
                    address: firstUser.address,
                },
                tooltip: formatAddress(firstUser.address, 16, 8),
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
        noteHash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: assetShape.isRequired,
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
