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
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';

const SignNotes = ({
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
                    text={i18n.t('note.sign.description')}
                    size="s"
                    weight="light"
                />
            </Block>
            <Ticket height={proof.inputNotes.length}>
                {proof.inputNotes.map(({ noteHash, k }) => (
                    <ListItem
                        key={noteHash}
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
                    text={i18n.t('note.sign.footnote')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

SignNotes.propTypes = {
    proof: PropTypes.shape({
        inputNotes: PropTypes.array.isRequired,
    }).isRequired,
};

export default SignNotes;
