import React from 'react';
import PropTypes from 'prop-types';
import makeAsset from '~uiModules/utils/asset';
import DepositConfirm from '~ui/views/DepositConfirm';
import DepositTransaction from '~ui/views/DepositTransaction';
import CombinedViews from '~ui/views/handlers/CombinedViews';

const Steps = [
    DepositConfirm,
    DepositTransaction,
];

const handleOnStep = (step) => {
    const newProps = {};
    switch (step) {
        case 1:
            newProps.autoStart = true;
            break;
        default:
    }

    return newProps;
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
            onStep={handleOnStep}
            autoClose
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
