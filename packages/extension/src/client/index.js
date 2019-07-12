import Aztec from './Aztec';

window.aztec = new Aztec();

const enableSite = async () => {
    const { aztec } = window;
    await aztec.enable();

    const note = await window.aztec.note('__note_id_0');
    await note.grantAccess('0x_account_00000000000000000000_address__5');
};

// TODO
// should be called with selected config through extension's UI
if (window.location.hostname.match(/aztecprotocol/)) {
    enableSite();
}
