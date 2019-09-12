import React from 'react';
import PropTypes from 'prop-types';
import {
    Link,
} from 'react-router-dom';
import {
    FlexBox,
    Block,
    TextButton,
} from '@aztec/guacamole-ui';
import Button from '~ui/components/Button';
import Header from '../Header';
import Description from './Description';
import styles from './popup.scss';

const Popup = ({
    theme,
    title,
    description,
    leftIconName,
    onClickLeftIcon,
    rightIconName,
    onClickRightIcon,
    submitButtonText,
    onSubmit,
    submitButton,
    footerLink,
    children,
}) => {
    const hasHeader = !!(title || onClickLeftIcon || onClickRightIcon);
    const headerNode = hasHeader
        ? (
            <Header
                title={title}
                leftIconName={leftIconName}
                onClickLeftIcon={onClickLeftIcon}
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
                                <Description
                                    text={description}
                                />
                            </Block>
                        )}
                        <Block
                            className="flex-free-expand"
                            stretch
                        >
                            {children}
                        </Block>
                        {!!(onSubmit || submitButton) && (
                            <Block
                                className="flex-fixed"
                                top="l"
                            >
                                {!onSubmit && submitButton}
                                {onSubmit && (
                                    <Button
                                        text={submitButtonText}
                                        onClick={onSubmit}
                                    />
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
    theme: PropTypes.oneOf(['primary', 'white']),
    title: PropTypes.string,
    description: PropTypes.string,
    leftIconName: PropTypes.string,
    onClickLeftIcon: PropTypes.func,
    rightIconName: PropTypes.string,
    onClickRightIcon: PropTypes.func,
    submitButtonText: PropTypes.string,
    onSubmit: PropTypes.func,
    submitButton: PropTypes.node,
    footerLink: PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
    }),
    children: PropTypes.node,
};

Popup.defaultProps = {
    theme: 'primary',
    title: '',
    description: '',
    leftIconName: '',
    onClickLeftIcon: null,
    rightIconName: '',
    onClickRightIcon: null,
    submitButtonText: '',
    onSubmit: null,
    submitButton: null,
    footerLink: null,
    children: null,
};

export default Popup;
