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
    address,
    linkedTokenAddress,
    code,
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
    address: PropTypes.string.isRequired,
    linkedTokenAddress: PropTypes.string.isRequired,
    code: PropTypes.string,
    balance: PropTypes.number.isRequired,
    onClick: PropTypes.func,
};

AssetSummaryLink.defaultProps = {
    className: '',
    code: '',
    onClick: null,
};

export default AssetSummaryLink;
