import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Offset,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';
import AssetSummaryLink from '~ui/components/AssetSummaryLink';
import TransactionHistorySummary from '~ui/components/TransactionHistorySummary';
import InplacePopup from '~ui/components/InplacePopup';

const Assets = ({
    assets,
    pastTransactions,
    isLoadingAssets,
    isLoadingTransactions,
    goBack,
    onClose,
    onClickAsset,
    onClickTransaction,
}) => (
    <Popup
        theme="primary"
        title={i18n.t('account.assets.title')}
        leftIconName={goBack ? 'chevron_left' : 'close'}
        onClickLeftIcon={goBack || onClose}
    >
        <FlexBox
            direction="column"
            align="space-between"
            stretch
            nowrap
        >
            <Offset margin="s 0">
                {!isLoadingAssets && !assets.length && (
                    <Block top="m">
                        <Text
                            text={i18n.t('asset.list.empty')}
                            color="white-lighter"
                        />
                    </Block>
                )}
                <InplacePopup
                    theme="primary"
                    items={assets}
                    renderItem={asset => (
                        <AssetSummaryLink
                            {...asset}
                            onClick={onClickAsset ? () => onClickAsset(asset) : onClickAsset}
                        />
                    )}
                    itemMargin="s 0"
                    margin="s m"
                    numberOfVisibleItems={3}
                />
            </Offset>
            <TransactionHistorySummary
                transactions={pastTransactions}
                isLoading={isLoadingTransactions}
                onClickTransaction={onClickTransaction}
            />
        </FlexBox>
    </Popup>
);

Assets.propTypes = {
    assets: PropTypes.arrayOf(PropTypes.shape({
        code: PropTypes.string.isRequired,
        balance: PropTypes.number.isRequired,
    })),
    pastTransactions: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        asset: PropTypes.shape({
            code: PropTypes.string.isRequired,
        }),
        address: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired,
    })),
    isLoadingAssets: PropTypes.bool,
    isLoadingTransactions: PropTypes.bool,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
    onClickAsset: PropTypes.func,
    onClickTransaction: PropTypes.func,
};

Assets.defaultProps = {
    assets: [],
    pastTransactions: [],
    isLoadingAssets: false,
    isLoadingTransactions: false,
    goBack: null,
    onClose: null,
    onClickAsset: null,
    onClickTransaction: null,
};

export default Assets;
