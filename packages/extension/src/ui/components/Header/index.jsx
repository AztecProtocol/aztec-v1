import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Offset,
    Text,
    Icon,
    Clickable,
} from '@aztec/guacamole-ui';
import styles from './header.scss';

const Header = ({
    title,
    leftIconName,
    onClickLeftIcon,
    disableOnClickLeftIcon,
    rightIconName,
    onClickRightIcon,
}) => {
    const hasButtons = !!(onClickLeftIcon || onClickRightIcon);
    if (!hasButtons && !title) {
        return null;
    }

    return (
        <Offset margin="0 l">
            <FlexBox
                align="space-between"
                valign="flex-start"
                nowrap
            >
                {hasButtons && (
                    <Block
                        className="flex-fixed"
                        padding="0 l"
                    >
                        <div className={styles['button-holder']}>
                            {onClickLeftIcon && !disableOnClickLeftIcon && (
                                <Clickable
                                    onClick={onClickLeftIcon}
                                    inline
                                >
                                    <Icon
                                        name={leftIconName}
                                        size="l"
                                    />
                                </Clickable>
                            )}
                        </div>
                    </Block>
                )}
                <Block
                    className="flex-free-expand"
                    align="center"
                >
                    <Text
                        size="m"
                        weight="light"
                        textAlign="center"
                    >
                        {title}
                    </Text>
                </Block>
                {hasButtons && (
                    <Block
                        className="flex-fixed"
                        padding="0 l"
                    >
                        <div className={styles['button-holder']}>
                            {onClickRightIcon && (
                                <Clickable
                                    onClick={onClickRightIcon}
                                    inline
                                >
                                    <Icon
                                        name={rightIconName}
                                        size="l"
                                    />
                                </Clickable>
                            )}
                        </div>
                    </Block>
                )}
            </FlexBox>
        </Offset>
    );
};

Header.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    leftIconName: PropTypes.string,
    onClickLeftIcon: PropTypes.func,
    disableOnClickLeftIcon: PropTypes.bool,
    rightIconName: PropTypes.string,
    onClickRightIcon: PropTypes.func,
};

Header.defaultProps = {
    title: '',
    leftIconName: '',
    onClickLeftIcon: null,
    disableOnClickLeftIcon: false,
    rightIconName: '',
    onClickRightIcon: null,
};

export default Header;
