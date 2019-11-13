import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import sendGlyph from '~ui/images/send.svg';
import PopupContent from '~ui/components/PopupContent';

const TransactionSend = ({
    description,
    descriptionKey,
    footnote,
    footnoteKey,
}) => (
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
                    text={description || i18n.t(descriptionKey)}
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
                    text={footnote || i18n.t(footnoteKey)}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

TransactionSend.propTypes = {
    description: PropTypes.string,
    descriptionKey: PropTypes.string,
    footnote: PropTypes.string,
    footnoteKey: PropTypes.string,
};

TransactionSend.defaultProps = {
    description: '',
    descriptionKey: 'transaction.send.explain',
    footnote: '',
    footnoteKey: 'transaction.send.footnote',
};

export default TransactionSend;
