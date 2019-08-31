import Account from '~background/database/models/account';

export default async function createOrUpdateAccount(rawAccount) {
    
    const existingRecord = await Account.get({address: rawAccount.address});
    let id;
    
    if(!existingRecord) {
        id = await Account.add(rawAccount);
    
    } else if(existingRecord.linkedPublicKey !== rawAccount.linkedPublicKey 
        && existingRecord.blockNumber !== rawAccount.blockNumber) {

        id = existingRecord.id;
        Account.update(id, rawAccount);    
    }

    return {
        id
    }
}