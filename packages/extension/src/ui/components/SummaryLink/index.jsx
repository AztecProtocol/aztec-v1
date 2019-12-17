import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Clickable,
    FlexBox,
    Block,
    Icon,
} from '@aztec/guacamole-ui';
import {
    profileShape,
} from '~/ui/config/propTypes';
import ProfileIcon from '~/ui/components/ProfileIcon';
import styles from './link.scss';

const SummaryLink = ({
    className,
    profile,
    children,
    hasButton,
    onClick,
}) => (
    <Clickable
        className={classnames(className, styles.link)}
        onClick={onClick}
    >
        <FlexBox
            valign="center"
            nowrap
        >
            <Block
                className="flex-fixed"
                padding="s"
            >
                <ProfileIcon
                    {...profile}
                    src={profile.icon}
                    size="s"
                />
            </Block>
            <div className={classnames('flex-free-expand', styles.content)}>
                {children}
            </div>
            {hasButton && (
                <div className={classnames('flex-fixed', styles.arrow)}>
                    <Icon
                        name="chevron_right"
                        size="l"
                    />
                </div>
            )}
        </FlexBox>
    </Clickable>
);

SummaryLink.propTypes = {
    className: PropTypes.string,
    profile: profileShape.isRequired,
    children: PropTypes.node,
    hasButton: PropTypes.bool,
    onClick: PropTypes.func,
};

SummaryLink.defaultProps = {
    className: '',
    children: null,
    hasButton: false,
    onClick: null,
};

export default SummaryLink;
