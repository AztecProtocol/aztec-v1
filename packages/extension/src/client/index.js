import Aztec from './Aztec';

window.aztec = new Aztec();

<<<<<<< HEAD
if (process.env.NODE_ENV === 'development') {
    if (window.location.hostname.match(/aztecprotocol/)) {
        const demo = require('./demo').default; // eslint-disable-line global-require
        demo();
=======
const demoApis = async () => {
    const { aztec } = window;

    try {
        await aztec.enable();
        // await aztec.auth.registerExtension({ password: 'test', salt: 'aaa' });
        // await aztec.auth.login({ password: 'test' });
        // await aztec.auth.registerAddress('0x3339C3c842732F4DAaCf12aed335661cf4eab66b');

        // await aztec.auth.enableAsset('0x9497dbaa053a638f63a96d546be0cbee80a161d1');

        // const note = await aztec.note('0x2153f72cb02058d3e4ac18267731095c2f56fbc17aa58ea709f5628856dbc59e');
        // console.log(note);

        // if (!note.isValid()) {
        //     console.log('note is not valid');
        // } else {
        //     await note.grantAccess([
        //         '0x0563a36603911daaB46A3367d59253BaDF500bF9',
        //     ]);
        // }

        // const asset = await aztec.asset('0x9497dbaa053a638f63a96d546be0cbee80a161d1');
        // console.log(asset);

        // if (!asset.isValid()) {
        //     console.log('asset is not valid');
        // } else {
        //     const newNote = await asset.createNoteFromBalance({
        //         amount: 5,
        //     });
        //     console.log(newNote);
        // }
    } catch (e) {
        console.error(e);
>>>>>>> feat(extension): working register extension
    }
}
