import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import Popup from '~ui/components/Popup';
import Logo from '~ui/components/Logo';

const Loading = ({
    message,
}) => (
    <Popup>
        <FlexBox
            direction="column"
            valign="center"
            align="center"
            stretch
        >
            <Block bottom={message ? 'l' : ''}>
                <Logo
                    spin
                />
            </Block>
            {!!message && (
                <Block top="xxl">
                    <Text
                        text={message}
                        size="xs"
                        color="white-light"
                    />
                </Block>
            )}
        </FlexBox>
    </Popup>
);

Loading.propTypes = {
    message: PropTypes.string,
};

Loading.defaultProps = {
    message: '',
};

export default Loading;
