import React from 'react';
import PropTypes from 'prop-types';
import {
    Offset,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import {
    assetShape,
} from '~/ui/config/propTypes';
import TransactionHistoryLink from '~/ui/components/TransactionHistoryLink';
import Separator from '~/ui/components/Separator';
import styles from './history.scss';

const TransactionHistorySummary = ({
    transactions,
    isLoading,
    onClickTransaction,
}) => (
    <Offset bottom="xs">
        <Block padding="s 0">
            <Separator
                theme="primary"
                title={i18n.t('transaction.history')}
            />
        </Block>
        <div className={styles.transactions}>
            {!isLoading && !transactions.length && (
                <Block top="m">
                    <Text
                        text={i18n.t('transaction.history.empty')}
                        color="white-lighter"
                    />
                </Block>
            )}
            {transactions.map((transaction, i) => (
                <Block
                    key={+i}
                    padding="xs 0"
                >
                    <TransactionHistoryLink
                        {...transaction}
                        onClick={onClickTransaction
                            ? () => onClickTransaction(transaction)
                            : onClickTransaction}
                    />
                </Block>
            ))}
        </div>
    </Offset>
);

TransactionHistorySummary.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string.isRequired,
        asset: assetShape.isRequired,
        address: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired,
    })),
    isLoading: PropTypes.bool,
    onClickTransaction: PropTypes.func,
};

TransactionHistorySummary.defaultProps = {
    transactions: [],
    isLoading: false,
    onClickTransaction: null,
};

export default TransactionHistorySummary;
