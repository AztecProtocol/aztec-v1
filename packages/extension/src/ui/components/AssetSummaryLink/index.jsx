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
    formatValue,
} from '~ui/utils/asset';
import SummaryLink from '~ui/components/SummaryLink';

const AssetSummaryLink = ({
    className,
    code,
    icon,
    balance,
    onClick,
}) => (
    <SummaryLink
        className={className}
        assetCode={code}
        assetIcon={icon}
        onClick={onClick}
        hasButton={!!onClick}
    >
        <Row
            margin="none"
            valign="center"
        >
            <Col
                column={6}
                margin="none"
            >
                <Block padding="s">
                    <Text
                        text={i18n.token(code)}
                    />
                </Block>
            </Col>
            <Col
                column={6}
                margin="none"
            >
                <Text
                    text={formatValue(code, balance)}
                />
            </Col>
        </Row>
    </SummaryLink>
);

AssetSummaryLink.propTypes = {
    className: PropTypes.string,
    code: PropTypes.string,
    icon: PropTypes.string,
    balance: PropTypes.number.isRequired,
    onClick: PropTypes.func,
};

AssetSummaryLink.defaultProps = {
    className: '',
    code: '',
    icon: '',
    onClick: null,
};

export default AssetSummaryLink;
