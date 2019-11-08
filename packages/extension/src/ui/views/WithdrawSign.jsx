import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import Ticket from '~ui/components/Ticket';
import ListItem from '~ui/components/ListItem';
import i18n from '~ui/helpers/i18n';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import signGlyph from '~ui/images/sign.svg';
import PopupContent from '~ui/components/PopupContent';

const WithdrawConfirm = ({
    asset,
    transactions: [firstTransaction],
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
            <Block padding="m 0 xl 0">
                <Text
                    text={i18n.t('withdraw.notes.blurb')}
                    size="s"
                    weight="light"
                />
            </Block>
            <Ticket height={proof.inputNotes.length}>

                {proof.inputNotes.map(({ noteHash, k }) => (
                    <ListItem
                        content={(
                            <Text
                                text={formatAddress(noteHash, 24, 4)}
                                size="xxs"
                            />
                        )}
                        size="xxs"
                        footnote={(
                            <Text
                                text={`(${k.words[0]})`}
                                color="green"
                                size="xxs"
                            />
                        )}
                    />

                ))}
            </Ticket>
            <Block padding="m xl">
                <Text
                    text={i18n.t('withdraw.notes.explain')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);
WithdrawConfirm.propTypes = {
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

export default WithdrawConfirm;
