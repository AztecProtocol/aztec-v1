import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    simpleAssetShape,
    errorShape,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import PopupContent from '~ui/components/PopupContent';
import ListItem from '~ui/components/ListItem';
import HashText from '~/ui/components/HashText';
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
            name,
            address,
            linkedTokenAddress,
            icon,
        }) => {
            icons.push({
                profile: {
                    type: 'asset',
                    address,
                    linkedTokenAddress,
                    icon,
                },
                tooltip: !hasRealAssets
                    ? null
                    : (!!name && (
                        <Text
                            text={name}
                            size="xxs"
                        />
                    )) || (
                        <HashText
                            text={address}
                            prefixLength={6}
                            suffixLength={4}
                            size="xxs"
                        />
                    ),
            });
        });
        if (assets.length > visibleAssets) {
            moreItems = assets.slice(visibleAssets).map(({
                address,
                linkedTokenAddress,
                icon,
            }, i) => (
                <ListItem
                    key={+i}
                    className="text-code"
                    profile={{
                        type: 'asset',
                        address,
                        linkedTokenAddress,
                        src: icon,
                    }}
                    content={(
                        <HashText
                            text={address}
                            prefixLength={6}
                            suffixLength={4}
                            size="xxs"
                        />
                    )}
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
                                            text={firstAsset.name}
                                            weight="semibold"
                                            showEllipsis
                                        />
                                        <HashText
                                            text={firstAsset.address}
                                            prefixLength={12}
                                            suffixLength={6}
                                            color={firstAsset.name ? 'label' : 'default'}
                                            size={firstAsset.name ? 'xxs' : 'xs'}
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
    assets: PropTypes.arrayOf(simpleAssetShape),
    assetPlaceholders: PropTypes.arrayOf(simpleAssetShape),
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
