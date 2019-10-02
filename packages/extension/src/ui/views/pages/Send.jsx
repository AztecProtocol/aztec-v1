import React from 'react';
import PropTypes from 'prop-types';
import CombinedViews from '~ui/views/handlers/CombinedViews';
import SendConfirm from '~ui/views/SendConfirm';
import SendTransaction from '~ui/views/SendTransaction';

const Steps = [
    SendConfirm,
    SendTransaction,
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

const Send = ({
    asset,
    user,
    transactions,
}) => (
    <CombinedViews
        Steps={Steps}
        initialData={{
            asset,
            user,
            transactions,
        }}
        onGoNext={handleGoNext}
    />
);

Send.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    user: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        account: PropTypes.shape({
            address: PropTypes.string.isRequired,
        }).isRequired,
    })).isRequired,
};

export default Send;
