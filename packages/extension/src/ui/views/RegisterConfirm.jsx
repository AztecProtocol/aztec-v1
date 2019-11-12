import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import sendGlyph from '~ui/images/send.svg';
import ListItem from '~ui/components/ListItem';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';

const RegisterConfirm = ({ address, linkedPublicKey }) => (
    <PopupContent
        theme="white"
    >
        <FlexBox direction="column" align="space-between" className="flex-free-expand">
            <Block padding="m 0">
                <Text
                    text={i18n.t('register.confirm.blurb')}
                    size="s"
                    weight="light"
                />
            </Block>
            <Block padding="m 0 l 0">
                <SVG
                    glyph={sendGlyph}
                    width={70}
                    height={70}
                />
            </Block>
            <Block padding="xs" background="white-lighter" borderRadius="s">
                <Block padding="s" align="center">
                    <ListItem
                        profile={{
                            type: 'user',
                            address,
                        }}
                        content={formatAddress(address, 16, 8)}
                        size="xs"
                    />
                </Block>
                <Block padding="s" align="center">
                    <ListItem
                        profile={{
                            type: 'asset',
                            address,
                        }}
                        content={formatAddress(linkedPublicKey, 16, 8)}
                        size="xs"
                    />
                </Block>
            </Block>
            <Block padding="m s">
                <Text
                    text={i18n.t('register.confirm.explain')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

RegisterConfirm.propTypes = {
    address: PropTypes.string.isRequired,
    linkedPublicKey: PropTypes.string.isRequired,
};

export default RegisterConfirm;
