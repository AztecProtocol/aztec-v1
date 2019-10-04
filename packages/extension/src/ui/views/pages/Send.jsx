import React from 'react';
import PropTypes from 'prop-types';
import makeAsset from '~uiModules/utils/asset';
import returnAndClose from '~ui/helpers/returnAndClose';
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
    assetAddress,
    sender,
    transactions,
}) => {
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const amount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            asset,
            sender,
            amount,
            transactions,
        };
    };
    return (
        <CombinedViews
            Steps={Steps}
            fetchInitialData={fetchInitialData}
            onGoNext={handleGoNext}
            onExit={returnAndClose}
        />
    );
};

Send.propTypes = {
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
};

export default Send;
