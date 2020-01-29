import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    themeType,
    profileShape,
} from '~/ui/config/propTypes';
import ProfileIcon from '~/ui/components/ProfileIcon';
import MoreItems from './MoreItems';
import styles from './profiles.scss';

const ProfileIconGroup = ({
    className,
    theme,
    size,
    icons,
    moreItems,
}) => (
    <div
        className={classnames(
            className,
            styles.group,
            styles[`group-${size}`],
            styles[`theme-${theme}`],
        )}
    >
        {icons.map(({
            profile,
            tooltip,
        }, i) => (
            <div
                key={+i}
                className={classnames(
                    styles.icon,
                    {
                        [styles.interactive]: tooltip,
                    },
                )}
            >
                <ProfileIcon
                    {...profile}
                    src={profile.icon}
                    theme={theme}
                    size={size}
                    tooltip={tooltip}
                />
            </div>
        ))}
        {moreItems && moreItems.length > 0 && (
            <ProfileIcon
                className={classnames(
                    styles.icon,
                    styles.interactive,
                )}
                theme={theme}
                size={size}
                alt={`+${moreItems.length}`}
                tooltip={(
                    <MoreItems
                        className={styles.moreItems}
                        items={moreItems}
                    />
                )}
            />
        )}
    </div>
);

ProfileIconGroup.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    size: PropTypes.string,
    icons: PropTypes.arrayOf(PropTypes.shape({
        profile: profileShape.isRequired,
        tooltip: PropTypes.oneOfType([
            PropTypes.element,
            PropTypes.string,
        ]),
    })).isRequired,
    moreItems: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
    ])),
};

ProfileIconGroup.defaultProps = {
    className: '',
    theme: 'primary',
    size: 'm',
    moreItems: [],
};

export default ProfileIconGroup;
