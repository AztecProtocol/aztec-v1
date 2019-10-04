import React from 'react';
import PropTypes from 'prop-types';
import makeAsset from '~uiModules/utils/asset';
import returnAndClose from '~ui/helpers/returnAndClose';
import DepositConfirm from '~ui/views/DepositConfirm';
import DepositTransaction from '~ui/views/DepositTransaction';
import CombinedViews from '~ui/views/handlers/CombinedViews';

const Steps = [
    DepositConfirm,
    DepositTransaction,
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

const Deposit = ({
    from,
    assetAddress,
    transactions,
}) => {
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const amount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            asset,
            from,
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

Deposit.propTypes = {
    from: PropTypes.string.isRequired,
    assetAddress: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
};

export default Deposit;
