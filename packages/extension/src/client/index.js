import Aztec from './Aztec';

window.aztec = new Aztec();

const testApis = async () => {
    const { aztec } = window;
    await aztec.enable();

    const note = await window.aztec.note('__note_id_0');
    await note.grantAccess([
        '0x_account_00000000000000000000_address__4',
        '0x_account_00000000000000000000_address__5',
    ]);
};

if (window.location.hostname.match(/aztecprotocol/)) {
    testApis();
}
