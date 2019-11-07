import React from 'react';
import {
    Block,
    Text,
    FlexBox,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import linkGlyph from '~ui/images/link.svg';
import Ticket from '~ui/components/Ticket';
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
        <Block padding="m 0 0 0">
            <SVG
                glyph={linkGlyph}
                width={90}
                height={90}
            />
        </Block>
        <Block padding="xl 0">
            <Text text={i18n.t('register.linkAccount.blurb')} />
        </Block>

        <Block padding="l" borderRadius="s" background="white-lighter">
            <FlexBox direction="column" align="center" valign="flex-start">
                <ListItem
                    content={'linkedPublicKey: '}
                    size="xxs"
                    weight="normal"
                    footnote={(
                        <Text
                            text={`${formatAddress(linkedPublicKey, 18, 4)}`}
                            color="label"
                        />
                    )}


                />
                <ListItem
                    content={'address: '}
                    size="xxs"
                    weight="normal"
                    footnote={(
                        <Text
                            text={`${formatAddress(address, 18, 4)}`}
                            color="label"
                        />
                    )}
                />
            </FlexBox>
        </Block>
        <Block padding="xl m">
            <Text text={i18n.t('register.linkAccount.important')} color="red" size="xxs" />
        </Block>

    </PopupContent>
);

LinkAccount.propTypes = {};

LinkAccount.defaultProps = {};

export default LinkAccount;
