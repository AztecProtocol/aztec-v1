import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
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
import ProfileIconGroup from '~ui/components/ProfileIconGroup';

const DomainPermissionTransaction = ({
    domain,
    assets,
    loading,
    success,
    error,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        name: domainName,
        domain: url,
        iconSrc,
    } = domain;
    const [firstAsset] = assets;
    const icons = [];
    let moreItems;
    if (assets.length > 1) {
        const maxAvatars = 3;
        assets.slice(0, maxAvatars).forEach(({
            code,
        }) => {
            icons.push({
                src: icon(code),
                alt: code.length > 2 ? code[0] : code,
                tooltip: name(code),
            });
        });
        if (assets.length > maxAvatars) {
            moreItems = assets.slice(maxAvatars).map(({ code }) => name(code));
        }
    }

    const title = i18n.t('domain.permission.title', { domain: domainName });

    return (
        <Popup
            theme="white"
            title={title}
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
                    {assets.length === 1 && (
                        <InfoRow
                            name={name(firstAsset.code)}
                            iconSrc={icon(firstAsset.code)}
                            nameHint={`(${formatAddress(firstAsset.address)})`}
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
                        size={title.length > 65 ? 'xxs' : 'xs'}
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
    assets: PropTypes.arrayOf(PropTypes.shape({
        code: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
    })),
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
