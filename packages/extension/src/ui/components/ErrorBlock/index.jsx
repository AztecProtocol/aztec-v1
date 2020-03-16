import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    FlexBox,
    Block,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import EntityBlock from '~/ui/components/AnimatedBlocks/EntityBlock';
import Button from '~/ui/components/Button';
import styles from './error.scss';

const ErrorBlock = ({
    className,
    message,
    leftButtonText,
    onClickLeftButton,
    rightButtonText,
    onClickRightButton,
}) => {
    const buttonNode = (
        <FlexBox
            align="center"
            direction="row"
            valing="center"
            nowrap
            expand
        >
            {!!(leftButtonText && onClickLeftButton) && (
                <Button
                    testId="button-step-previous"
                    className={styles['left-button']}
                    theme="white"
                    size="m"
                    text={leftButtonText}
                    onSubmit={onClickLeftButton}
                    expand
                />
            )}
            {!!(rightButtonText && onClickRightButton) && (
                <Button
                    testId="button-step-next"
                    className={styles['right-button']}
                    theme="secondary"
                    size="m"
                    text={rightButtonText}
                    onSubmit={onClickRightButton}
                    expand
                />
            )}
        </FlexBox>
    );

    return (
        <EntityBlock
            className={classnames(
                className,
                styles.block,
            )}
            title={(
                <Text
                    text={i18n.t('transaction.error')}
                    color="red"
                    size="xs"
                    weight="semibold"
                />
            )}
            titleFootnote={(
                <Icon
                    name="warning"
                    color="red"
                    size="m"
                />
            )}
            content={(
                <Block padding="m 0">
                    <Text
                        text={message}
                        size="m"
                        weight="light"
                    />
                </Block>
            )}
            layer={1}
        >
            {buttonNode}
        </EntityBlock>
    );
};

ErrorBlock.propTypes = {
    className: PropTypes.string,
    message: PropTypes.string.isRequired,
    leftButtonText: PropTypes.string,
    onClickLeftButton: PropTypes.func,
    rightButtonText: PropTypes.string,
    onClickRightButton: PropTypes.func,
};

ErrorBlock.defaultProps = {
    className: '',
    leftButtonText: '',
    onClickLeftButton: null,
    rightButtonText: '',
    onClickRightButton: null,
};

export default ErrorBlock;
