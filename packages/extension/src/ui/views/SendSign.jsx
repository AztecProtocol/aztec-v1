import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import Ticket from '~ui/components/Ticket';
import ListItem from '~ui/components/ListItem';
import i18n from '~ui/helpers/i18n';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';

const SendSign = ({
    asset,
    totalAmount,
    proof,
}) => (
    <PopupContent
        theme="white"
    >
        <FlexBox
            direction="column"
            align="center"
            valign="center"
            className="flex-free-expand"
            expand
            stretch
            nowrap
        >
            <Block padding="m xl">
                <Text
                    text={i18n.t('send.notes.amount', {
                        totalAmount,
                        assetName: asset.name || 'ERC20',
                    })}
                    size="xl"
                    weight="semibold"
                />
            </Block>
            <Ticket height={proof.inputNotes.length}>

                {proof.inputNotes.map(({ noteHash, k }) => (
                    <ListItem
                        content={formatAddress(noteHash, 24, 4)}
                        size="xxs"
                        footnote={(
                            <Text
                                text={`(${k.words[0]})`}
                                color="green"
                            />
                        )}
                    />

                ))}
            </Ticket>
            <Block padding="m xl">
                <Text
                    text={i18n.t('send.notes.explain')}
                    size="xs"
                    color="red"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);
SendSign.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    proof: PropTypes.shape({
        inputNotes: PropTypes.array.isRequired,
    }).isRequired,
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            to: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default SendSign;
