import React from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Col,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    name,
    icon,
    formatValue,
} from '~ui/utils/asset';
import ProfileIcon from '~ui/components/ProfileIcon';
import Button from '~ui/components/Button';

const AssetSummary = ({
    className,
    code,
    balance,
}) => (
    <Block
        className={className}
        padding="xl"
        background="white-lightest"
        borderRadius="xs"
    >
        <ProfileIcon
            src={icon(code)}
            alt={code}
            size="l"
        />
        <Block top="m">
            <Text
                text={name(code)}
                size="m"
            />
        </Block>
        <Block padding="m 0">
            <Text
                text={formatValue(code, balance)}
                size="l"
                weight="semibold"
            />
        </Block>
        <Block top="s">
            <Row margin="s">
                <Col column={6} margin="s">
                    <Button
                        text={i18n.t('asset.deposit')}
                        rounded={false}
                        theme="white"
                        outlined
                        expand
                    />
                </Col>
                <Col column={6} margin="s">
                    <Button
                        text={i18n.t('asset.send')}
                        rounded={false}
                        theme="white"
                        outlined
                        expand
                    />
                </Col>
            </Row>
        </Block>
    </Block>
);

AssetSummary.propTypes = {
    className: PropTypes.string,
    code: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
};

AssetSummary.defaultProps = {
    className: '',
};

export default AssetSummary;
