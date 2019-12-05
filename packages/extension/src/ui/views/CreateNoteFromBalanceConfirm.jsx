import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    valueOf,
} from '~/utils/note';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import {
    assetShape,
    rawNoteShape,
} from '~/ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatNumber from '~ui/utils/formatNumber';
import PopupContent from '~ui/components/PopupContent';
import Connection from '~ui/components/Connection';
import ListItem from '~ui/components/ListItem';
import HashText from '~/ui/components/HashText';

const CreateNoteFromBalanceConfirm = ({
    asset: {
        address: assetAddress,
        decimals,
    },
    sender,
    owner,
    amount,
    numberOfInputNotes,
    numberOfOutputNotes,
    inputNotes,
    outputNotes,
    remainderNote,
}) => {
    const visibleNotes = 2;
    const totalInputAmount = inputNotes.reduce((sum, note) => sum + valueOf(note), 0);
    const moreInputNotes = inputNotes
        .slice(visibleNotes)
        .map(note => (
            <ListItem
                content={(
                    <HashText
                        text={note.noteHash}
                        prefixLength={6}
                        suffixLength={4}
                        size="xxs"
                    />
                )}
                size="xxs"
                footnote={(
                    <Text
                        text={`-${formatNumber(valueOf(note), decimals)}`}
                        color="red"
                    />
                )}
            />
        ));

    const proofOutputNotes = !remainderNote
        ? outputNotes
        : outputNotes.filter(({
            noteHash,
        }) => noteHash !== remainderNote.noteHash);
    const moreOutputNotes = proofOutputNotes
        .slice(visibleNotes)
        .map(note => (
            <ListItem
                content={(
                    <HashText
                        text={note.noteHash}
                        prefixLength={6}
                        suffixLength={4}
                        size="xxs"
                    />
                )}
                size="xxs"
                footnote={(
                    <Text
                        text={`+${formatNumber(valueOf(note), decimals)}`}
                        color="green"
                    />
                )}
            />
        ));

    return (
        <PopupContent
            title={(
                <Text
                    text={i18n.t('note.create.fromBalance.title', {
                        asset: (
                            <HashText
                                key="asset-address"
                                text={assetAddress}
                                prefixLength={6}
                                suffixLength={4}
                                size="xl"
                            />
                        ),
                    })}
                    size="xl"
                    weight="light"
                />
            )}
            description={i18n.t('note.create.fromBalance.description', {
                newNoteText: i18n.t('note.count.withAdj', {
                    count: numberOfOutputNotes,
                    adj: i18n.t('note.adj.new'),
                }),
                oldNoteText: i18n.t('note.count.withAdj', {
                    count: numberOfInputNotes,
                    adj: i18n.t('note.adj.existing'),
                }),
            })}
        >
            <Block padding="l 0">
                <Connection
                    theme="white"
                    from={{
                        profileGroup: inputNotes.slice(0, visibleNotes).map(note => ({
                            profile: {
                                type: 'note',
                                noteHash: note.noteHash,
                            },
                            tooltip: (
                                <ListItem
                                    content={(
                                        <HashText
                                            text={note.noteHash}
                                            prefixLength={6}
                                            suffixLength={4}
                                            size="xxs"
                                        />
                                    )}
                                    size="xxs"
                                    footnote={(
                                        <Text
                                            text={`-${formatNumber(valueOf(note), decimals)}`}
                                            color="red"
                                        />
                                    )}
                                />
                            ),
                        })),
                        description: (
                            <FlexBox
                                valign="baseline"
                                nowrap
                            >
                                <HashText
                                    text={sender}
                                    prefixLength={6}
                                    suffixLength={4}
                                    size="xxs"
                                />
                                <Block left="s">
                                    <Text
                                        text={`-${formatNumber(totalInputAmount, decimals)}`}
                                        color="red"
                                    />
                                </Block>
                            </FlexBox>
                        ),
                        moreItems: moreInputNotes,
                    }}
                    to={{
                        profileGroup: proofOutputNotes.slice(0, visibleNotes).map(note => ({
                            profile: {
                                type: 'note',
                                noteHash: note.noteHash,
                            },
                            tooltip: (
                                <ListItem
                                    content={(
                                        <HashText
                                            text={note.noteHash}
                                            prefixLength={6}
                                            suffixLength={4}
                                            size="xxs"
                                        />
                                    )}
                                    size="xxs"
                                    footnote={(
                                        <Text
                                            text={`+${formatNumber(valueOf(note), decimals)}`}
                                            color="green"
                                        />
                                    )}
                                />
                            ),
                        })),
                        description: (
                            <FlexBox
                                valign="baseline"
                                nowrap
                            >
                                <Block right="s">
                                    <Text
                                        text={`+${formatNumber(amount, decimals)}`}
                                        color="green"
                                    />
                                </Block>
                                <HashText
                                    text={owner}
                                    prefixLength={6}
                                    suffixLength={4}
                                    size="xxs"
                                />
                            </FlexBox>
                        ),
                        moreItems: moreOutputNotes,
                    }}
                    size="s"
                    actionIconName="double_arrow"
                />
            </Block>
            {!!remainderNote && (
                <Block padding="l">
                    <Block
                        padding="l"
                        background="grey-lightest"
                        borderRadius="s"
                    >
                        <Block bottom="m">
                            <Text
                                text={i18n.t('note.create.fromBalance.remainder.description')}
                            />
                        </Block>
                        <ListItem
                            profile={{
                                type: 'note',
                                noteHash: remainderNote.noteHash,
                            }}
                            content={(
                                <HashText
                                    text={remainderNote.noteHash}
                                    prefixLength={12}
                                    suffixLength={6}
                                    size="xs"
                                    color="label"
                                />
                            )}
                            size="xs"
                            footnote={(
                                <Text
                                    text={`+${formatNumber(valueOf(remainderNote), decimals)}`}
                                    color="green"
                                />
                            )}
                        />
                    </Block>
                </Block>
            )}
            <Block padding="l">
                <Text
                    text={i18n.t('note.create.fromBalance.explain')}
                    size="xs"
                    color="label"
                />
            </Block>
        </PopupContent>
    );
};

CreateNoteFromBalanceConfirm.propTypes = {
    asset: assetShape.isRequired,
    sender: PropTypes.string.isRequired,
    owner: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
    inputNotes: PropTypes.arrayOf(rawNoteShape).isRequired,
    outputNotes: PropTypes.arrayOf(rawNoteShape).isRequired,
    remainderNote: rawNoteShape,
};

CreateNoteFromBalanceConfirm.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
    remainderNote: null,
};

export default CreateNoteFromBalanceConfirm;
