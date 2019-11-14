import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import PopupContent from '~ui/components/PopupContent';
import AssetSummary from '~ui/components/AssetSummary';
import TransactionHistorySummary from '~ui/components/TransactionHistorySummary';

const Asset = ({
    address,
    linkedTokenAddress,
    code,
    balance,
    pastTransactions,
    isLoadingTransactions,
}) => (
    <PopupContent
        title={i18n.t('account.assets.title')}
    >
        <Block padding="0 l l">
            <AssetSummary
                address={address}
                linkedTokenAddress={linkedTokenAddress}
                code={code}
                balance={balance}
            />
        </Block>
        <TransactionHistorySummary
            transactions={pastTransactions}
            isLoading={isLoadingTransactions}
        />
    </PopupContent>
);

Asset.propTypes = {
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string.isRequired,
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
};

Asset.defaultProps = {
    code: '',
    balance: null,
    pastTransactions: [],
    isLoadingTransactions: false,
};

export default Asset;
