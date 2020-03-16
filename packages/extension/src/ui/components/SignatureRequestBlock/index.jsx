import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Block,
    FlexBox,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import prettyPrint from '~/utils/prettyPrint';
import i18n from '~/ui/helpers/i18n';
import EntityBlock from '~/ui/components/AnimatedBlocks/EntityBlock';
import BlockStatus from '~/ui/components/AnimatedBlocks/BlockStatus';
import Code from '~/ui/components/Code';
import {
    iconSizeMap,
} from '~/ui/styles/guacamole-vars';
import checkGlyph from '~/ui/images/tick.svg';
import styles from './sig.scss';

const SignatureRequestBlock = ({
    signatures,
    signed,
    loading,
}) => (
    <EntityBlock
        className={classnames(
            styles.block,
            {
                [styles.signed]: signed,
            },
        )}
        title={signed ? '' : i18n.t('transaction.request.signature')}
        titleFootnote={loading ? (
            <BlockStatus
                status="loading"
                text={i18n.t('pending')}
            />
        ) : null}
        layer={1}
    >
        {!signed && (
            <Block padding="xs xl m">
                <Code>
                    {prettyPrint(signatures, 2)}
                </Code>
            </Block>
        )}
        <Block
            className={styles['signed-message']}
            padding="m xl"
        >
            <FlexBox
                direction="column"
                valign="center"
            >
                <Block padding="xs 0">
                    <SVG
                        glyph={checkGlyph}
                        color="white-light"
                        width={iconSizeMap.xl}
                        height={iconSizeMap.xl}
                    />
                </Block>
                <Block padding="xs 0">
                    <Text
                        text={i18n.t('transaction.request.signature.received')}
                        size="s"
                        color="white"
                    />
                </Block>
            </FlexBox>
        </Block>
    </EntityBlock>
);

SignatureRequestBlock.propTypes = {
    signatures: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    signed: PropTypes.bool,
    loading: PropTypes.bool,
};

SignatureRequestBlock.defaultProps = {
    signed: false,
    loading: false,
};

export default SignatureRequestBlock;
