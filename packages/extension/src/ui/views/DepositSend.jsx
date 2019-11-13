import React from 'react';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import sendGlyph from '~ui/images/send.svg';
import PopupContent from '~ui/components/PopupContent';

const DepositSend = () => (
    <PopupContent
        theme="white"
    >
        <FlexBox
            direction="column"
            align="center"
            valign="center"
            className="flex-free-expand"
            expand
            stretch
            nowrap
        >
            <Block padding="0 l l l">
                <Text
                    text={i18n.t('deposit.send.explain')}
                    size="s"
                    weight="light"
                />
            </Block>
            <Block padding="xl 0 xl 0">
                <SVG
                    glyph={sendGlyph}
                    width={100}
                    height={100}
                />
            </Block>
            <Block padding="0 l">
                <Text
                    text={i18n.t('deposit.send.footer')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

export default DepositSend;
