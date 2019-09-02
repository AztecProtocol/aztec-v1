import AuthService from '~background/services/AuthService';
import NoteService from '~background/services/NoteService';

export default async function getAssetBalance(assetId) {
    const {
        address,
    } = await AuthService.getCurrentUser();

    return NoteService.getBalance(address, assetId);
}
