import React from 'react';
import PropTypes from 'prop-types';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import ConfirmNoteAccess from '~ui/views/ConfirmNoteAccess';
import GrantNoteAccess from '~ui/views/GrantNoteAccess';

const Steps = [
    ConfirmNoteAccess,
    GrantNoteAccess,
];

const handleGoNext = (step, prevData) => {
    let data = prevData;
    switch (step) {
        case 0: {
            data = {
                ...data,
                autoStart: true,
            };
            break;
        }
        default:
    }

    return data;
};

const NoteAccess = ({
    note,
    accounts,
}) => (
    <CombinedViews
        Steps={Steps}
        initialData={{
            note,
            accounts,
        }}
        onGoNext={handleGoNext}
    />
);

NoteAccess.propTypes = {
    note: PropTypes.shape({
        hash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: PropTypes.shape({
            code: PropTypes.string.isRequired,
            address: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
};

export default NoteAccess;
