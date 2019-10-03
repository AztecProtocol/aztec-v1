import React from 'react';
import PropTypes from 'prop-types';
import {
    defaultInt,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import closeWindow from '~ui/utils/closeWindow';
import ConnectionService from '~ui/services/ConnectionService';
import WithdrawTransaction from '~ui/views/WithdrawTransaction';
import CombinedViews from '~ui/views/handlers/CombinedViews';

const Steps = [
    WithdrawTransaction,
];

const handleExit = () => {
    ConnectionService.returnToClient();
    closeWindow(1000);
};

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
            onExit={handleExit}
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
    numberOfInputNotes: defaultInt,
};

export default Withdraw;
