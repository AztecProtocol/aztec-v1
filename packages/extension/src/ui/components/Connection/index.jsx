import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    FlexBox,
    Block,
    Icon,
    Text,
} from '@aztec/guacamole-ui';
import ProfileIconGroup from '~/ui/components/ProfileIconGroup';
import {
    avatarSizesMap,
} from '~/ui/styles/guacamole-vars';
import {
    themeType,
    profileShape,
} from '~/ui/config/propTypes';
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
        profileGroup: fromProfileGroup,
        tooltip: fromTooltip,
        moreItems: fromMoreItems,
    } = from;
    const {
        title: toTitle,
        description: toDesc,
        profile: toProfile,
        profileGroup: toProfileGroup,
        tooltip: toTooltip,
        moreItems,
    } = to;
    const fromIcons = fromProfileGroup
        || [
            {
                profile: fromProfile,
                tooltip: fromTooltip,
            },
        ];
    const toIcons = toProfileGroup
        || [
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
            <FlexBox
                align="center"
                valign="center"
            >
                <Block
                    className={styles.contentLeft}
                >
                    {fromTitle && (
                        <Block
                            className={styles.colLeft}
                            right="s"
                        >
                            <Text
                                size="xs"
                                color="label"
                            >
                                {fromTitle}
                            </Text>
                        </Block>
                    )}
                    <ProfileIconGroup
                        theme={theme}
                        size={size}
                        icons={fromIcons}
                        moreItems={fromMoreItems}
                    />
                </Block>
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
                <Block
                    className={styles.contentRight}
                >
                    <ProfileIconGroup
                        className={styles.iconGroupRight}
                        theme={theme}
                        size={size}
                        icons={toIcons}
                        moreItems={moreItems}
                    />
                    {toTitle && (
                        <Block
                            className={styles.colRight}
                            left="s"
                        >
                            <Text
                                size="xs"
                                color="label"
                            >
                                {toTitle}
                            </Text>
                        </Block>
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

const connectionItemShape = PropTypes.shape({
    profile: profileShape,
    profileGroup: PropTypes.arrayOf(PropTypes.shape({
        profile: profileShape,
        tooltip: PropTypes.oneOfType([
            PropTypes.element,
            PropTypes.string,
        ]),
    })),
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
});

Connection.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    actionIconName: PropTypes.string,
    actionIconColor: PropTypes.string,
    from: connectionItemShape.isRequired,
    to: connectionItemShape.isRequired,
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
