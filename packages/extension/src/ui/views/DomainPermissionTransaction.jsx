import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ListItem from '~ui/components/ListItem';
import ProfileIconGroup from '~ui/components/ProfileIconGroup';


const DomainPermissionTransaction = ({
    domain,
    assets,
    loading,
    success,
    error, goNext, goBack,
    onClose,
}) => {
    const {
        name: domainName,
        domain: domainUrl,
        iconSrc,
    } = domain;
    const [firstAsset] = assets;
    const icons = [];
    let moreItems;
    if (assets.length > 1) {
        const maxAvatars = 3;
        assets.slice(0, maxAvatars).forEach(({
            address,
            tokenAddress,
            code,
        }) => {
            icons.push({
                profile: {
                    type: 'asset',
                    address,
                    tokenAddress,
                },
                tooltip: i18n.token(code) || formatAddress(address, 12, 6),
            });
        });
        if (assets.length > maxAvatars) {
            moreItems = assets.slice(maxAvatars).map(({
                address,
                tokenAddress,
            }, i) => (
                <ListItem
                    key={+i}
                    className="text-code"
                    profile={{
                        type: 'asset',
                        address,
                        tokenAddress,
                    }}
                    content={formatAddress(address, 12, 6)}
                    size="xxs"
                />
            ));
        }
    }

    const title = i18n.t('domain.permission.title');
    return (
        <Popup
            theme="white"
            title={(
                <div>
                    <Text weight="medium" text={domainName} />
                    <Text text={title} />
                </div>
            )}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('domain.permission.grant')}
            onSubmit={goNext}
            loading={loading}
            success={success}
            error={error}
        >
            <FlexBox
                direction="column"
                align="space-between"
                stretch
                nowrap
            >
                <Ticket height={4}>
                    <ListItem
                        profile={{
                            type: 'domain',
                            src: iconSrc,
                            alt: domainName,
                        }}
                        content={(
                            <div>
                                <Text
                                    size="m"
                                    text={domainName}
                                    weight="semibold"
                                    showEllipsis
                                />
                                <Text
                                    text={domainUrl}
                                    color="label"
                                    size="xxs"
                                />
                            </div>
                        )}
                    />
                    <Block padding={firstAsset ? 'l 0' : 'xl 0 0'}>
                        <Text
                            text={i18n.t('domain.permission.requesting', assets.length)}
                            size={firstAsset ? 'xs' : 's'}
                        />
                    </Block>
                    {assets.length === 1 && (
                        <ListItem
                            profile={{
                                type: 'asset',
                                address: firstAsset.address,
                                tokenAddress: firstAsset.tokenAddress,
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
                </Ticket>
                <Block padding={`${firstAsset ? 'l' : 'xl'} xl 0`}>
                    <Text
                        text={i18n.t('domain.permission.explain')}
                        size="xxs"
                        color="label"
                    />
                </Block>
            </FlexBox>
        </Popup>
    );
};

DomainPermissionTransaction.propTypes = {
    domain: PropTypes.shape({
        name: PropTypes.string.isRequired,
        domain: PropTypes.string.isRequired,
        iconSrc: PropTypes.string,
    }).isRequired,
    assets: PropTypes.arrayOf(assetShape),
    loading: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

DomainPermissionTransaction.defaultProps = {
    assets: [],
    loading: false,
    success: false,
    error: null,
    goBack: null,
    onClose: null,
};

export default DomainPermissionTransaction;
