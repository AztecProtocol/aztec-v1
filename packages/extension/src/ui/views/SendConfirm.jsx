import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Offset,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    formatValue,
} from '~ui/utils/asset';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import AddressRow from '~ui/components/AddressRow';
import AssetRow from '~ui/components/AssetRow';
import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const SendConfirm = ({
    asset,
    user,
    transactions,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        code,
    } = asset;

    const assetInfoNode = (
        <AssetRow
            {...asset}
            size="xxs"
            textSize="inherit"
            prefixLength={6}
            suffixLength={4}
        />
    );

    const {
        address: fromAddress,
    } = user;

    const userInfoNode = (
        <AddressRow
            address={fromAddress}
            textSize="inherit"
            size="xxs"
            prefixLength={6}
            suffixLength={4}
        />
    );

    const totalAmount = transactions.reduce((accum, {
        amount,
    }) => accum + amount, 0);

    return (
        <Popup
            theme="white"
            title={i18n.t('send.transaction')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('send')}
            onSubmit={goNext}
        >
            <FlexBox
                direction="column"
                align="space-between"
                stretch
                nowrap
            >
                <div>
                    <Ticket height={2}>
                        <Offset margin="xs 0">
                            <ListRow
                                title={i18n.t('asset.send.from')}
                                content={userInfoNode}
                            />
                            <ListRow
                                title={i18n.t('asset')}
                                content={assetInfoNode}
                            />
                            <ListRow
                                title={i18n.t('asset.amount.total')}
                                content={formatValue(code, totalAmount)}
                            />
                        </Offset>
                    </Ticket>
                    <Block padding="0 xl">
                        <Block top="xl">
                            <Separator
                                theme="white"
                                title={i18n.t('to')}
                            />
                            <Block padding="m 0">
                                <InplacePopup
                                    theme="white"
                                    items={transactions}
                                    renderItem={({
                                        amount,
                                        account: {
                                            address,
                                        },
                                    }) => (
                                        <FlexBox
                                            align="space-between"
                                            valign="center"
                                        >
                                            <AddressRow
                                                address={address}
                                                size="xs"
                                                textSize="xxs"
                                                prefixLength={12}
                                                suffixLength={6}
                                                inline
                                            />
                                            <Text
                                                text={`+${formatValue(code, amount)}`}
                                                size="xxs"
                                                color="green"
                                            />
                                        </FlexBox>
                                    )}
                                    itemMargin="xs 0"
                                    margin="xs m"
                                    numberOfVisibleItems={2}
                                />
                            </Block>
                        </Block>
                    </Block>
                </div>
                <Block padding="0 xl">
                    <Text
                        text={i18n.t('note.access.grant.explain')}
                        size="xs"
                        color="label"
                    />
                </Block>
            </FlexBox>
        </Popup>
    );
};

SendConfirm.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
        icon: PropTypes.string,
    }).isRequired,
    user: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        account: PropTypes.shape({
            address: PropTypes.string.isRequired,
        }).isRequired,
    })).isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

SendConfirm.defaultProps = {
    goBack: null,
    onClose: null,
};

export default SendConfirm;
