import React from 'react';
import PropTypes from 'prop-types';
import {
    fetchNote,
} from 'ui/apis/note';
import {
    getExtensionAccount,
} from 'ui/apis/account';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import apis from '~uiModules/apis';
import NoteAccessConfirm from '~ui/views/NoteAccessConfirm';

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
    id,
    addresses,
}) => {
    const fetchInitialData = async () => {
        const note = await fetchNote(id);
        const accounts = await Promise.all(addresses.map(getExtensionAccount));

        return {
            note,
            accounts,
        };
    };

    return (

        <AnimatedTransaction
            steps={steps}
            fetchInitialData={fetchInitialData}
            initialData={
                {
                    id,
                    addresses,
                }
            }
            onExit={returnAndClose}
        />
    );
};

NoteAccess.propTypes = {
    id: PropTypes.string.isRequired,
    addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default NoteAccess;
