import * as note from '~/background/database/models/note';

export default async function fetchNotesFromIndexedDB(
    networkId,
    ownerAddress,
    {
        assetId = null,
        count = 200,
        fromBlockNumber = 0, // exclude
        toBlockNumber = -1, // exclude
    } = {},
) {
    const condition = {
        owner: ownerAddress,
    };
    if (assetId) {
        condition.asset = assetId;
    }

    let query = Note.query({ networkId })
        .where(condition);
    if (toBlockNumber >= 0) {
        query = query.and(n => n.blockNumber > fromBlockNumber)
            .and(n => n.blockNumber < toBlockNumber);
    } else {
        query = query.and(n => n.blockNumber > fromBlockNumber);
    }
    const matchingNoteIds = new Set(await query.primaryKeys());

    const noteIds = [];
    await Note.query({ networkId })
        .orderBy('blockNumber')
        .until(() => noteIds.length === count)
        .eachPrimaryKey(async (id) => {
            if (matchingNoteIds.has(id)) {
                noteIds.push(id);
            }
        });

    const notes = await Promise.all(noteIds.map(id => Note.get(
        { networkId },
        id,
    )));

    return notes;
}
