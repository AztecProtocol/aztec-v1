import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    FlexBox,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import linkGlyph from '~ui/images/link.svg';
import formatAddress from '~ui/utils/formatAddress';
import ListItem from '~ui/components/ListItem';
import PopupContent from '~ui/components/PopupContent';

const LinkAccount = ({
    linkedPublicKey,
    address,
}) => (
    <PopupContent
        theme="white"
    >
        <Block padding="m 0 l 0">
            <Text text={i18n.t('register.linkAccount.blurb')} size="s" weight="light" />
        </Block>
        <Block padding="s 0">
            <SVG
                glyph={linkGlyph}
                width={70}
                height={70}
            />
        </Block>
        <Block padding="m 0 m 0">
            <Block padding="l" borderRadius="s" background="white-lighter">
                <FlexBox direction="column" align="center" valign="flex-start">
                    <ListItem
                        content={`${i18n.t('account.address')}:`}
                        size="xs"
                        weight="light"
                        footnote={(
                            <Text
                                text={`${formatAddress(address, 18, 4)}`}
                                size="xs"
                                color="label"
                            />
                        )}
                    />
                    <ListItem
                        content={`${i18n.t('account.linkedPublicKey')}:`}
                        size="xs"
                        weight="light"
                        footnote={(
                            <Text
                                text={`${formatAddress(linkedPublicKey, 12, 4)}`}
                                size="xs"
                                color="label"
                            />
                        )}
                    />
                </FlexBox>
            </Block>
            <Block padding="l m">
                <Text
                    text={i18n.t('register.linkAccount.important')}
                    color="red"
                    size="xs"
                />
            </Block>
        </Block>
    </PopupContent>
);

LinkAccount.propTypes = {
    linkedPublicKey: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
};

export default LinkAccount;
