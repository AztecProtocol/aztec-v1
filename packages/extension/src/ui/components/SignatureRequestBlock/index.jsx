import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Block,
    FlexBox,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import prettyPrint from '~/utils/prettyPrint';
import i18n from '~/ui/helpers/i18n';
import EntityBlock from '~/ui/components/AnimatedBlocks/EntityBlock';
import Code from '~/ui/components/Code';
import styles from './sig.scss';

const SignatureRequestBlock = ({
    signatures,
    signed,
}) => (
    <EntityBlock
        className={classnames(
            styles.block,
            {
                [styles.signed]: signed,
            },
        )}
        title={signed ? '' : i18n.t('transaction.request.signature')}
        layer={1}
    >
        {!signed && (
            <Block padding="xs xl m">
                <Code>
                    {prettyPrint(signatures)}
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
                    <Icon
                        name="check"
                        size="xl"
                        color="white"
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
};

SignatureRequestBlock.defaultProps = {
    signed: false,
};

export default SignatureRequestBlock;
