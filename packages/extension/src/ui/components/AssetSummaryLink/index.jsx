import React from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Col,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import formatNumber from '~ui/utils/formatNumber';
import SummaryLink from '~ui/components/SummaryLink';

const AssetSummaryLink = ({
    className,
    address,
    linkedTokenAddress,
    name,
    balance,
    onClick,
}) => (
    <SummaryLink
        className={className}
        profile={{
            type: 'asset',
            address,
            linkedTokenAddress,
        }}
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
                        text={name}
                    />
                </Block>
            </Col>
            <Col
                column={6}
                margin="none"
            >
                <Text
                    text={formatNumber(balance)}
                />
            </Col>
        </Row>
    </SummaryLink>
);

AssetSummaryLink.propTypes = {
    className: PropTypes.string,
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string.isRequired,
    name: PropTypes.string,
    balance: PropTypes.number.isRequired,
    onClick: PropTypes.func,
};

AssetSummaryLink.defaultProps = {
    className: '',
    name: '',
    onClick: null,
};

export default AssetSummaryLink;
