import React from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import makeAsset from '~/ui/utils/makeAsset';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import NoteAccessConfirm from '~/ui/views/NoteAccessConfirm';

const steps = [
    {
        titleKey: 'note.access.grant.title',
        submitTextKey: 'note.access.grant.submit',
        content: NoteAccessConfirm,
        tasks: [
            {
                name: 'encrypt',
                run: apis.note.grantNoteAccess,
            },
            {
                name: 'send',
                run: apis.asset.updateNoteMetadata,
            },
        ],
    },
];

const NoteAccess = ({
    initialStep,
    id,
    addresses,
}) => {
    const fetchInitialData = async () => {
        const note = await apis.note.fetchNote(id);
        const {
            asset,
        } = note;
        const accounts = await Promise.all(addresses.map(apis.account.getExtensionAccount));

        return {
            id,
            addresses,
            note,
            asset: await makeAsset(asset),
            accounts,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
        />
    );
};

NoteAccess.propTypes = {
    initialStep: PropTypes.number,
    id: PropTypes.string.isRequired,
    addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
};

NoteAccess.defaultProps = {
    initialStep: 0,
};

export default NoteAccess;
