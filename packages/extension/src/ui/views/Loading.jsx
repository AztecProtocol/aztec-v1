import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import Popup from '~ui/components/Popup';
import Logo from '~ui/components/Logo';

class Loading extends PureComponent {
    componentDidMount() {
        const {
            onStart,
        } = this.props;
        if (onStart) {
            this.doStart(onStart);
        }
    }

    async doStart(callback) {
        const data = await callback();

        const {
            goNext,
        } = this.props;
        if (goNext) {
            goNext(data);
        }
    }

    render() {
        const {
            message,
        } = this.props;

        return (
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
    }
}

Loading.propTypes = {
    message: PropTypes.string,
    onStart: PropTypes.func,
    goNext: PropTypes.func,
};

Loading.defaultProps = {
    message: '',
    onStart: null,
    goNext: null,
};

export default Loading;
