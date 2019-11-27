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
import {
    themeType,
    profileShape,
} from '~ui/config/propTypes';
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
        profile: fromProfile,
        tooltip: fromTooltip,
    } = from;
    const {
        title: toTitle,
        description: toDesc,
        profile: toProfile,
        tooltip: toTooltip,
        moreItems,
    } = to;
    const toIcons = [
        {
            profile: toProfile,
            tooltip: toTooltip,
        },
    ];

    return (
        <div
            className={classnames(
                className,
                styles.wrapper,
                styles[`size-${size}`],
            )}
        >
            <FlexBox valign="center">
                <Block
                    className={styles.colLeft}
                    right="s"
                >
                    {fromTitle && (
                        <Text
                            size="xs"
                            color="label"
                        >
                            {fromTitle}
                        </Text>
                    )}
                </Block>
                <FlexBox
                    align="center"
                    valign="center"
                >
                    <ProfileIcon
                        {...fromProfile}
                        src={fromProfile.icon}
                        fromTooltip={fromTooltip}
                        theme={theme}
                        size={size}
                    />
                    <FlexBox valign="center">
                        <Block padding="xs">
                            <Icon
                                name="more_horiz"
                                color="grey-lighter"
                                size="xs"
                            />
                        </Block>
                        <Block padding="xs">
                            <Icon
                                name={actionIconName}
                                color={actionIconColor}
                                size={size}
                            />
                        </Block>
                        <Block padding="xs">
                            <Icon
                                name="more_horiz"
                                color="grey-lighter"
                                size="xs"
                            />
                        </Block>
                    </FlexBox>
                    <ProfileIconGroup
                        className={styles.iconGroupRight}
                        theme={theme}
                        size={size}
                        icons={toIcons}
                        moreItems={moreItems}
                    />
                </FlexBox>
                <Block
                    className={styles.colRight}
                    left="s"
                >
                    {toTitle && (
                        <Text
                            size="xs"
                            color="label"
                        >
                            {toTitle}
                        </Text>
                    )}
                </Block>
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
    theme: themeType,
    actionIconName: PropTypes.string,
    actionIconColor: PropTypes.string,
    from: PropTypes.shape({
        profile: profileShape.isRequired,
        tooltip: PropTypes.oneOfType([
            PropTypes.element,
            PropTypes.string,
        ]),
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
        profile: profileShape.isRequired,
        tooltip: PropTypes.oneOfType([
            PropTypes.element,
            PropTypes.string,
        ]),
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
        description: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
        moreItems: PropTypes.arrayOf(PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element,
        ])),
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
