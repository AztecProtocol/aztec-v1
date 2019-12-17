import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Offset,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import {
    assetShape,
} from '~/ui/config/propTypes';
import PopupContent from '~/ui/components/PopupContent';
import AssetSummaryLink from '~/ui/components/AssetSummaryLink';
import TransactionHistorySummary from '~/ui/components/TransactionHistorySummary';
import InplacePopup from '~/ui/components/InplacePopup';

const Assets = ({
    assets,
    pastTransactions,
    isLoadingAssets,
    isLoadingTransactions,
    onClickAsset,
    onClickTransaction,
}) => (
    <PopupContent
        title={i18n.t('account.assets.title')}
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
    </PopupContent>
);

Assets.propTypes = {
    assets: PropTypes.arrayOf(assetShape),
    pastTransactions: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        asset: assetShape.isRequired,
        address: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired,
    })),
    isLoadingAssets: PropTypes.bool,
    isLoadingTransactions: PropTypes.bool,
    onClickAsset: PropTypes.func,
    onClickTransaction: PropTypes.func,
};

Assets.defaultProps = {
    assets: [],
    pastTransactions: [],
    isLoadingAssets: false,
    isLoadingTransactions: false,
    onClickAsset: null,
    onClickTransaction: null,
};

export default Assets;
