import { RegisterExtension } from '../types/AZTECAccountRegistry/AZTECAccountRegistry';
import { Account } from '../types/schema';

export function registerExtension(event: RegisterExtension): void {
    let address = event.params.account;
    let id = address.toHexString();
    let account = Account.load(id);
    if (account == null) {
        account = new Account(id);
        account.address = address;
    }
    account.linkedPublicKey = event.params.linkedPublicKey;
    account.registeredAt = event.block.timestamp;
    account.save();
}
