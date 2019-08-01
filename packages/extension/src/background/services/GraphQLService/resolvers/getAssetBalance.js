import AuthService from '~background/services/AuthService';
import NoteService from '~background/services/NoteService';

export default async function getAssetBalance(assetAddress) {
    const {
        address,
    } = await AuthService.getCurrentUser();

    return NoteService.getBalance(address, assetAddress);
}
