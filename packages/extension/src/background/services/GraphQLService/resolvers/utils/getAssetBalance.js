import Web3Service from '~/helpers/Web3Service';
import AuthService from '~/background/services/AuthService';
import NoteService from '~/background/services/NoteService';

export default async function getAssetBalance(assetId) {
    const {
        address,
    } = await AuthService.getCurrentUser();
    const {
        networkId,
    } = Web3Service;

    return NoteService.getBalance(
        networkId,
        address,
        assetId,
    );
}
