import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import formatNumber from '~ui/utils/formatNumber';
import {
    assetShape,
} from '~/ui/config/propTypes';
import PopupContent from '~ui/components/PopupContent';
import Connection from '~ui/components/Connection';
import ListItem from '~ui/components/ListItem';
import Ticket from '~ui/components/Ticket';
import HashText from '~/ui/components/HashText';

const WithdrawConfirm = ({
    asset: {
        address: assetAddress,
        linkedTokenAddress,
        name,
        decimals,
    },
    currentAddress,
    publicOwner,
    amount,
}) => (
    <PopupContent
        title={(
            <div>
                <Text
                    text={i18n.t('withdraw.confirm.title')}
                    size="xl"
                    weight="light"
                />
                <Block padding="0 s" inline>
                    <Text
                        text={formatNumber(amount, decimals)}
                        size="xl"
                        weight="bold"
                    />
                </Block>
                <Text
                    text={name || i18n.t('erc20.token')}
                    size="xl"
                    weight="light"
                />
            </div>
        )}
    >
        <Block padding="l 0">
            <Ticket height={2}>
                <Connection
                    theme="white"
                    from={{
                        profile: {
                            type: 'asset',
                            address: assetAddress,
                            linkedTokenAddress,
                        },
                        tooltip: (
                            <ListItem
                                content={(
                                    <HashText
                                        text={currentAddress}
                                        prefixLength={6}
                                        suffixLength={4}
                                    />
                                )}
                                size="xxs"
                                footnote={(
                                    <Text
                                        text={`-${formatNumber(amount, decimals)}`}
                                        color="red"
                                    />
                                )}
                            />
                        ),
                        description: (
                            <HashText
                                text={assetAddress}
                                prefixLength={6}
                                suffixLength={4}
                                size="xxs"
                            />
                        ),
                    }}
                    to={{
                        profile: {
                            type: 'user',
                            address: publicOwner,
                        },
                        tooltip: (
                            <ListItem
                                content={(
                                    <HashText
                                        text={publicOwner}
                                        prefixLength={6}
                                        suffixLength={4}
                                    />
                                )}
                                size="xxs"
                                footnote={(
                                    <Text
                                        text={`+${formatNumber(amount, decimals)}`}
                                        color="green"
                                    />
                                )}
                            />
                        ),
                        description: (
                            <HashText
                                text={publicOwner}
                                prefixLength={6}
                                suffixLength={4}
                                size="xxs"
                            />
                        ),
                    }}
                    size="s"
                    actionIconName="double_arrow"
                />
            </Ticket>
        </Block>
        <Block padding="l">
            <Text
                text={i18n.t('withdraw.confirm.explain')}
                size="xs"
                color="label"
            />
        </Block>
    </PopupContent>
);

WithdrawConfirm.propTypes = {
    asset: assetShape.isRequired,
    currentAddress: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    publicOwner: PropTypes.string.isRequired,
};

export default WithdrawConfirm;
