import validateAccounts from './utils/validateAccounts';

export default async function grantNoteAccess({
    addresses,
}) {
    return validateAccounts(addresses);
}
