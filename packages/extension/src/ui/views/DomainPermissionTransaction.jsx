import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
    errorShape,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';
import ListItem from '~ui/components/ListItem';
import ProfileIconGroup from '~ui/components/ProfileIconGroup';

const DomainPermissionTransaction = ({
    assets: realAssets,
    assetPlaceholders,
    error,
    visibleAssets,
}) => {
    const hasRealAssets = realAssets.length > 0;
    const assets = hasRealAssets ? realAssets : assetPlaceholders;
    const [firstAsset] = assets;

    const icons = [];
    let moreItems;
    if (assets.length > 1) {
        assets.slice(0, visibleAssets).forEach(({
            address, linkedTokenAddress,
            code,
        }) => {
            icons.push({
                profile: {
                    type: 'asset',
                    address,
                    linkedTokenAddress,
                },
                tooltip: hasRealAssets
                    ? i18n.token(code) || formatAddress(address, 12, 6)
                    : '',
            });
        });
        if (assets.length > visibleAssets) {
            moreItems = assets.slice(visibleAssets).map(({
                address,
                linkedTokenAddress,
            }, i) => (
                <ListItem
                    key={+i}
                    className="text-code"
                    profile={{
                        type: 'asset',
                        address,
                        linkedTokenAddress,
                    }}
                    content={formatAddress(address, 12, 6)}
                    size="xxs"
                />
            ));
        }
    }

    return (
        <PopupContent
            error={error}
        >
            <Block padding="0 l">
                <FlexBox
                    direction="column"
                    align="center"
                    valign="center"
                    stretch
                    nowrap
                >
                    <Block padding="l 0">
                        <Text
                            text={i18n.t('domain.permission.explain')}
                            size="s"
                            weight="light"
                        />
                    </Block>
                    <Block padding="l 0">
                        {assets.length === 1 && (
                            <ListItem
                                profile={{
                                    type: 'asset',
                                    address: firstAsset.address,
                                    linkedTokenAddress: firstAsset.linkedTokenAddress,
                                }}
                                content={(
                                    <div>
                                        <Text
                                            size="s"
                                            text={i18n.token(firstAsset.code)}
                                            weight="semibold"
                                            showEllipsis
                                        />
                                        <Text
                                            className="text-code"
                                            text={formatAddress(firstAsset.address, 12, 6)}
                                            color="label"
                                            size="xxs"
                                        />
                                    </div>
                                )}
                            />
                        )}
                        {assets.length > 1 && (
                            <ProfileIconGroup
                                theme="white"
                                size="s"
                                icons={icons}
                                moreItems={moreItems}
                            />
                        )}
                    </Block>
                    <Block padding="l 0">
                        <Text
                            text={i18n.t('domain.permission.footer')}
                            size="s"
                        />
                    </Block>
                </FlexBox>
            </Block>
        </PopupContent>
    );
};

DomainPermissionTransaction.propTypes = {
    assets: PropTypes.arrayOf(assetShape),
    assetPlaceholders: PropTypes.arrayOf(assetShape),
    error: errorShape,
    visibleAssets: PropTypes.number,
};

DomainPermissionTransaction.defaultProps = {
    assets: [],
    assetPlaceholders: [],
    error: null,
    visibleAssets: 3,
};

export default DomainPermissionTransaction;
