import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    AvatarGroup,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    name,
    icon,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import InfoRow from '~ui/components/InfoRow';

const DomainPermission = ({
    domain,
    assets,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        name: domainName,
        url,
        iconSrc,
    } = domain;
    const [firstAsset] = assets;
    const avatars = [];
    if (assets.length > 1) {
        const maxAvatars = 3;
        const maxAvatarList = 2;
        const tooltipBackground = 'grey-dark';
        assets.slice(0, maxAvatars).forEach(({
            code,
        }) => {
            avatars.push({
                src: icon(code),
                alt: code.length > 2 ? code[0] : code,
                tooltip: name(code),
                tooltipBackground,
            });
        });
        if (assets.length > maxAvatars) {
            const tooltipNode = (
                <div>
                    {assets.slice(maxAvatars, maxAvatars + maxAvatarList).map(({
                        code,
                    }) => (
                        <Block
                            key={code}
                            padding="xxs"
                        >
                            <Text
                                text={name(code)}
                                size="xxs"
                            />
                        </Block>
                    ))}
                    {(assets.length > maxAvatars + maxAvatarList) && (
                        <Block padding="xxs">
                            <Text
                                text={i18n.t('and.more.count', assets.length - (maxAvatars + maxAvatarList))}
                                size="xxs"
                                color="white-lighter"
                            />
                        </Block>
                    )}
                </div>
            );
            avatars.push({
                alt: `+${assets.length - maxAvatars}`,
                background: 'grey-lightest',
                tooltip: tooltipNode,
                tooltipBackground,
            });
        }
    }

    return (
        <Popup
            theme="white"
            title={i18n.t('domain.permission.title', { domain: domainName })}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('domain.permission.grant')}
            onSubmit={goNext}
        >
            <Ticket height={firstAsset ? 5 : 4}>
                <InfoRow
                    name={domainName}
                    iconSrc={iconSrc}
                    description={url}
                />
                <Block padding={firstAsset ? 'l 0' : 'xl 0 0'}>
                    <Text
                        text={i18n.t('domain.permission.requesting', assets.length)}
                        size={firstAsset ? 'xs' : 's'}
                    />
                </Block>
                {firstAsset && (
                    <Block top="xs">
                        {assets.length === 1 && (
                            <InfoRow
                                name={name(firstAsset.code)}
                                iconSrc={icon(firstAsset.code)}
                                nameHint={`(${formatAddress(firstAsset.address)})`}
                            />
                        )}
                        {assets.length > 1 && (
                            <AvatarGroup
                                avatars={avatars}
                            />
                        )}
                    </Block>
                )}
            </Ticket>
            <Block padding={`${firstAsset ? 'l' : 'xl'} xl 0`}>
                <Text
                    text={i18n.t('domain.permission.explain')}
                    size="xs"
                    color="label"
                />
            </Block>
        </Popup>
    );
};

DomainPermission.propTypes = {
    domain: PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        iconSrc: PropTypes.string,
    }).isRequired,
    assets: PropTypes.arrayOf(PropTypes.shape({
        code: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
    })),
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

DomainPermission.defaultProps = {
    assets: [],
    goBack: null,
    onClose: null,
};

export default DomainPermission;
