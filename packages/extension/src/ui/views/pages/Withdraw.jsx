import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import returnAndClose from '~ui/helpers/returnAndClose';
import WithdrawTransaction from '~ui/views/WithdrawTransaction';
import CombinedViews from '~ui/views/handlers/CombinedViews';

const Steps = [
    WithdrawTransaction,
];

const Withdraw = ({
    assetAddress,
    sender,
    amount,
    numberOfInputNotes,
}) => {
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);

        return {
            asset,
            sender,
            to: sender,
            amount,
            numberOfInputNotes,
        };
    };

    return (
        <CombinedViews
            Steps={Steps}
            fetchInitialData={fetchInitialData}
            onExit={returnAndClose}
        />
    );
};

Withdraw.propTypes = {
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    numberOfInputNotes: PropTypes.number,
};

Withdraw.defaultProps = {
    numberOfInputNotes: emptyIntValue,
};

export default Withdraw;
