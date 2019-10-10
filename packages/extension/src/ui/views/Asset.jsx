import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';
import AssetSummary from '~ui/components/AssetSummary';
import TransactionHistorySummary from '~ui/components/TransactionHistorySummary';

const Asset = ({
    address,
    tokenAddress,
    code,
    balance,
    goBack,
    onClose,
    pastTransactions,
    isLoadingTransactions,
}) => (
    <Popup
        theme="primary"
        title={i18n.t('account.assets.title')}
        leftIconName={goBack ? 'chevron_left' : 'close'}
        onClickLeftIcon={goBack || onClose}
    >
        <Block padding="0 l l">
            <AssetSummary
                address={address}
                tokenAddress={tokenAddress}
                code={code}
                balance={balance}
            />
        </Block>
        <TransactionHistorySummary
            transactions={pastTransactions}
            isLoading={isLoadingTransactions}
        />
    </Popup>
);

Asset.propTypes = {
    address: PropTypes.string.isRequired,
    tokenAddress: PropTypes.string.isRequired,
    code: PropTypes.string,
    balance: PropTypes.number,
    pastTransactions: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        asset: PropTypes.shape({
            code: PropTypes.string.isRequired,
        }),
        address: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired,
    })),
    isLoadingTransactions: PropTypes.bool,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Asset.defaultProps = {
    code: '',
    balance: null,
    pastTransactions: [],
    isLoadingTransactions: false,
    goBack: null,
    onClose: null,
};

export default Asset;
