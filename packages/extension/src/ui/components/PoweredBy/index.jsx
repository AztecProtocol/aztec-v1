import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    FlexBox,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import {
    themeType,
} from '~/ui/config/propTypes';
import ProfileIcon from '~/ui/components/ProfileIcon';
import styles from './powered.scss';

const PoweredBy = ({
    className,
    theme,
}) => (
    <FlexBox
        className={classnames(
            className,
            styles['powered-by'],
        )}
        valign="center"
    >
        <div className={styles.left}>
            <Text
                text={i18n.t('poweredBy')}
                size="xxs"
                color="white"
                weight="light"
            />
        </div>
        <ProfileIcon
            className="flex-fixed"
            type="aztec"
            theme={theme}
            size="xs"
        />
        <div className={styles.right}>
            <Text
                text="AZTEC"
                size="xs"
                color="white"
            />
        </div>
    </FlexBox>
);

PoweredBy.propTypes = {
    className: PropTypes.string,
    theme: themeType.isRequired,
};

PoweredBy.defaultProps = {
    className: '',
};

export default PoweredBy;
