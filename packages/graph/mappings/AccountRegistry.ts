import { RegisterExtension } from '../types/AZTECAccountRegistry/AZTECAccountRegistry';
import { Account } from '../types/schema';

export function registerExtension(event: RegisterExtension): void {
    let address = event.params.account;
    let linkedPublicKey = event.params.linkedPublicKey;
    let id = address.toHexString();
    let account = Account.load(id);
    if (account == null) {
        account = new Account(id);
    }
    account.linkedPublicKey = linkedPublicKey;
    account.registered = true;
    account.address = address;
    account.save();
}
