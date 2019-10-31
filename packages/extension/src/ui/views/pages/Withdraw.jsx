import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import WithdrawTransaction from '~ui/views/WithdrawTransaction';
import CombinedViews from '~ui/views/handlers/CombinedViews';

const Steps = [
    WithdrawTransaction,
];

const Withdraw = ({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
}) => {
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);

        return {
            asset,
            sender,
            to: sender,
            transactions,
            numberOfInputNotes,
        };
    };

    return (
        <CombinedViews
            Steps={Steps}
            fetchInitialData={fetchInitialData}
            autoClose
        />
    );
};

Withdraw.propTypes = {
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfInputNotes: PropTypes.number,
};

Withdraw.defaultProps = {
    numberOfInputNotes: emptyIntValue,
};

export default Withdraw;
