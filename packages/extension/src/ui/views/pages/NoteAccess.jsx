import React from 'react';
import PropTypes from 'prop-types';
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
            address: PropTypes.string.isRequired,
            code: PropTypes.string,
        }).isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
};

export default NoteAccess;
