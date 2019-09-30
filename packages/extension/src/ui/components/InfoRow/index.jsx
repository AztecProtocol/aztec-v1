import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import ProfileIcon from '~ui/components/ProfileIcon';
import styles from './info.scss';

const InfoRow = ({
    className,
    iconSrc,
    name,
    nameHint,
    description,
}) => (
    <FlexBox
        className={className}
        valign="center"
        nowrap
    >
        <ProfileIcon
            className="flex-fixed"
            src={iconSrc}
            alt={name}
            size="m"
        />
        <Block
            className={`flex-free-expand ${styles.content}`}
            left="m"
        >
            <FlexBox valign="center">
                <Text
                    text={name}
                    size="m"
                    weight="semibold"
                    showEllipsis
                />
                {!!nameHint && (
                    <Block left="s">
                        <Text
                            text={nameHint}
                            weight="light"
                            color="grey-dark"
                            size="xs"
                        />
                    </Block>
                )}
            </FlexBox>
            {!!description && (
                <Text
                    text={description}
                    color="label"
                    size="xxs"
                />
            )}
        </Block>
    </FlexBox>
);

InfoRow.propTypes = {
    className: PropTypes.string,
    iconSrc: PropTypes.string,
    name: PropTypes.string.isRequired,
    nameHint: PropTypes.string,
    description: PropTypes.string,
};

InfoRow.defaultProps = {
    className: '',
    iconSrc: '',
    nameHint: '',
    description: '',
};

export default InfoRow;
