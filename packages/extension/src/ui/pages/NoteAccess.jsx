import React from 'react';
import PropTypes from 'prop-types';
import apis from '~uiModules/apis';
import makeAsset from '~/ui/utils/makeAsset';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import GrantNoteAccessContent from '~/ui/views/GrantNoteAccessContent';
import grantNoteAccessSteps from '~/ui/steps/grantNoteAccess';

const NoteAccess = ({
    id,
    addresses,
}) => {
    const steps = grantNoteAccessSteps.metamask;

    const fetchInitialData = async () => {
        const note = await apis.note.fetchNote(id);
        const asset = await makeAsset(note.asset);
        const userAccessAccounts = await Promise.all(
            addresses.map(apis.account.getExtensionAccount),
        );

        return {
            amount: note.value,
            note,
            asset,
            userAccessAccounts,
        };
    };

    return (
        <StepsHandler
            testId="steps-note-access"
            steps={steps}
            fetchInitialData={fetchInitialData}
            Content={GrantNoteAccessContent}
        />
    );
};

NoteAccess.propTypes = {
    id: PropTypes.string.isRequired,
    addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default NoteAccess;
