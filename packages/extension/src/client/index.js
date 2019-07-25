import Aztec from './Aztec';

window.aztec = new Aztec();

const demoApis = async () => {
    const { aztec } = window;

    try {
        await aztec.enable();
        // await aztec.auth.registerExtension({ password: 'test', salt: 'aaa' });
        // await aztec.auth.login({ password: 'test' });
        await aztec.auth.registerAddress('0x3339C3c842732F4DAaCf12aed335661cf4eab66b');

        await aztec.auth.enableAsset('0xe4edf908d85b0dd7954ac7fc4ac5fce42f8cbcd8');

        const note = await aztec.note('0x5de18596198e30c67f6027ee0d5b365344f08ca8182173647efebbbe035ef70c');
        console.log(note);

        if (note.isValid()) {
            await note.grantAccess([
                '0x0563a36603911daaB46A3367d59253BaDF500bF9',
            ]);
        }

        const asset = await aztec.asset('0xaa58bb2568509ce8de69471bf4fe202080c59965');
        console.log(asset);
    } catch (e) {
        console.log(e);
    }
};

if (window.location.hostname.match(/aztecprotocol/)) {
    demoApis();
}
