import React from 'react';
import PropTypes from 'prop-types';
import {
    fetchNote,
} from 'ui/apis/note';
import {
    getExtensionAccount,
} from 'ui/apis/account';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import NoteAccessConfirm from '~ui/views/NoteAccessConfirm';
import NoteAccessTransaction from '~ui/views/NoteAccessTransaction';

const Steps = [
    NoteAccessConfirm,
    NoteAccessTransaction,
];

const handleGoNext = (step) => {
    const newProps = {};
    switch (step) {
        case 0:
            newProps.autoStart = true;
            break;
        default:
    }

    return newProps;
};

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
        <CombinedViews
            Steps={Steps}
            fetchInitialData={fetchInitialData}
            onGoNext={handleGoNext}
        />
    );
};

NoteAccess.propTypes = {
    id: PropTypes.string.isRequired,
    addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default NoteAccess;
