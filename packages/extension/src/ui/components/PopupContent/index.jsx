import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';
import {
    FlexBox,
    Block,
    TextButton,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import {
    themeType,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import Button from '~ui/components/Button';
import Header from '../Header';
import styles from './popup.scss';

const Popup = ({
    theme,
    title,
    description,
    leftIconName,
    onClickLeftIcon,
    disableOnClickLeftIcon,
    rightIconName,
    onClickRightIcon,
    submitButtonText,
    successMessage,
    onSubmit,
    submitButton,
    footerLink,
    children,
    loading,
    success,
    error,
}) => {
    const hasHeader = !!(title || onClickLeftIcon || onClickRightIcon);
    const headerNode = hasHeader
        ? (
            <Header
                title={title}
                leftIconName={leftIconName}
                onClickLeftIcon={onClickLeftIcon}
                disableOnClickLeftIcon={disableOnClickLeftIcon}
                rightIconName={rightIconName}
                onClickRightIcon={onClickRightIcon}
            />
        )
        : null;

    return (
        <Block
            className={styles[`popup-${theme}`]}
            align="center"
        >
            <FlexBox
                direction="column"
                nowrap
                stretch
            >
                {!!headerNode && (
                    <Block
                        className="flex-fixed"
                        padding="xl xl 0"
                    >
                        {headerNode}
                    </Block>
                )}
                <Block
                    className="flex-free-expand"
                    padding="xl"
                    stretch
                >
                    <FlexBox
                        direction="column"
                        nowrap
                        stretch
                    >
                        {!!description && (
                            <Block
                                className="flex-fixed"
                                bottom="l"
                            >
                                <Block
                                    padding="0 xl"
                                >
                                    <Text
                                        text={description}
                                        size="xs"
                                        color="label"
                                    />
                                </Block>
                            </Block>
                        )}
                        <Block
                            className="flex-free-expand"
                            stretch
                        >
                            {children}
                        </Block>
                        {!!(onSubmit || submitButton || error) && (
                            <Block
                                className="flex-fixed"
                                top="l"
                            >
                                {error && (
                                    <Block bottom={error.fetal ? 's' : 'm'}>
                                        <Text
                                            text={error.message
                                                || i18n.t(error.key, error.response)}
                                            color="red"
                                            size="xxs"
                                        />
                                    </Block>
                                )}
                                {success && successMessage && (
                                    <Block bottom="s">
                                        <Text
                                            text={successMessage}
                                            color="primary"
                                            size="xs"
                                            weight="semibold"
                                        />
                                    </Block>
                                )}
                                {submitButton}
                                {!submitButton
                                    && onSubmit
                                    && (!error || !error.fetal)
                                    && (!success || !successMessage)
                                    && (
                                        <Button
                                            onClick={onSubmit}
                                            loading={loading}
                                        >
                                            {!success && submitButtonText}
                                            {success && (
                                                <Icon
                                                    name="done"
                                                    size="m"
                                                />
                                            )}
                                        </Button>
                                    )}
                            </Block>
                        )}
                        {!!footerLink && (
                            <Block
                                className="flex-fixed"
                                top={onSubmit ? 'm' : 'l'}
                            >
                                <TextButton
                                    {...footerLink}
                                    Link={Link}
                                    color="label"
                                    size="xxs"
                                />
                            </Block>
                        )}
                    </FlexBox>
                </Block>
            </FlexBox>
        </Block>
    );
};

Popup.propTypes = {
    theme: themeType,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    description: PropTypes.string,
    leftIconName: PropTypes.string,
    onClickLeftIcon: PropTypes.func,
    disableOnClickLeftIcon: PropTypes.bool,
    rightIconName: PropTypes.string,
    onClickRightIcon: PropTypes.func,
    submitButtonText: PropTypes.string,
    successMessage: PropTypes.string,
    onSubmit: PropTypes.func,
    submitButton: PropTypes.node,
    footerLink: PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    }),
    children: PropTypes.node,
    loading: PropTypes.bool,
    success: PropTypes.bool,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
};

Popup.defaultProps = {
    theme: 'primary',
    title: '',
    description: '',
    leftIconName: '',
    onClickLeftIcon: null,
    disableOnClickLeftIcon: false,
    rightIconName: '',
    onClickRightIcon: null,
    submitButtonText: '',
    successMessage: '',
    onSubmit: null,
    submitButton: null,
    footerLink: null,
    children: null,
    loading: false,
    success: false,
    error: null,
};

export default Popup;
