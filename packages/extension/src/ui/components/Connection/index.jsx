import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    FlexBox,
    Block,
    Icon,
    Text,
} from '@aztec/guacamole-ui';
import ProfileIcon from '~ui/components/ProfileIcon';
import ProfileIconGroup from '~ui/components/ProfileIconGroup';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';
import styles from './connection.scss';

const Connection = ({
    className,
    theme,
    actionIconName,
    actionIconColor,
    from,
    to,
    size,
}) => {
    const {
        title: fromTitle,
        description: fromDesc,
        ...fromIcon
    } = from;
    const {
        title: toTitle,
        description: toDesc,
        moreItems,
        ...toIcon
    } = to;
    const toIcons = [toIcon];

    return (
        <div
            className={classnames(
                className,
                styles[`size-${size}`],
            )}
        >
            <FlexBox valign="center">
                <div className={styles.colLeft}>
                    {fromTitle && (
                        <Text
                            size="xxs"
                            color="label"
                        >
                            {fromTitle}
                        </Text>
                    )}
                </div>
                <FlexBox
                    align="center"
                    valign="center"
                >
                    <ProfileIcon
                        theme={theme}
                        size={size}
                        {...fromIcon}
                    />
                    <Block padding="s">
                        <Icon
                            name={actionIconName}
                            color={actionIconColor}
                            size={size}
                        />
                    </Block>
                    <ProfileIconGroup
                        theme={theme}
                        size={size}
                        icons={toIcons}
                        moreItems={moreItems}
                    />
                </FlexBox>
                <div className={styles.colRight}>
                    {toTitle && (
                        <Text
                            size="xxs"
                            color="label"
                        >
                            {toTitle}
                        </Text>
                    )}
                </div>
            </FlexBox>
            {!!(fromDesc || toDesc) && (
                <Block top="s">
                    <FlexBox align="space-between">
                        <div className={styles.contentLeft}>
                            {fromDesc && (
                                <Text
                                    size="xxs"
                                    color="label"
                                >
                                    {fromDesc}
                                </Text>
                            )}
                        </div>
                        <div className={styles.contentRight}>
                            {toDesc && (
                                <Text
                                    size="xxs"
                                    color="label"
                                >
                                    {toDesc}
                                </Text>
                            )}
                        </div>
                    </FlexBox>
                </Block>
            )}
        </div>
    );
};

Connection.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.oneOf(['primary', 'white']),
    actionIconName: PropTypes.string,
    actionIconColor: PropTypes.string,
    from: PropTypes.shape({
        type: PropTypes.oneOf(['', 'asset', 'user']),
        src: PropTypes.string,
        alt: PropTypes.string,
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
        description: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
    }).isRequired,
    to: PropTypes.shape({
        type: PropTypes.oneOf(['', 'asset', 'user']),
        src: PropTypes.string,
        alt: PropTypes.string,
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
        description: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
        moreItems: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
};

Connection.defaultProps = {
    className: '',
    theme: 'primary',
    actionIconName: 'chevron_right',
    actionIconColor: 'label',
    size: 'm',
};

export default Connection;
