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
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';

const PopupContent = ({
    className,
    successMessage,
    footerLink,
    children,
    success,
    error,
}) => (
    <Block
        className={className}
        padding="0 xl"
    >
        <FlexBox
            direction="column"
            nowrap
            align="center"
            stretch
            expand
        >
            <Block
                className="flex-free-expand"
                padding="0"
            >
                {children}
            </Block>
            {!!(error || success) && (
                <Block
                    className="flex-fixed"
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
                </Block>
            )}
            {!!footerLink && (
                <Block
                    className="flex-fixed"
                    padding="m"
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
);

PopupContent.propTypes = {
    className: PropTypes.string,
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
    success: PropTypes.bool,
    error: PropTypes.shape({
        key: PropTypes.string,
        message: PropTypes.string,
        response: PropTypes.object,
        fetal: PropTypes.bool,
    }),
};

PopupContent.defaultProps = {
    className: '',
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
    success: false,
    error: null,
};

export default PopupContent;
