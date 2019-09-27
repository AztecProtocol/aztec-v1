import React from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Col,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    name,
    formatValue,
} from '~ui/utils/asset';
import SummaryLink from '~ui/components/SummaryLink';

const AssetSummaryLink = ({
    className,
    code,
    balance,
    onClick,
}) => (
    <SummaryLink
        className={className}
        assetCode={code}
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
                        text={name(code)}
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
    code: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
    onClick: PropTypes.func,
};

AssetSummaryLink.defaultProps = {
    className: '',
    onClick: null,
};

export default AssetSummaryLink;
