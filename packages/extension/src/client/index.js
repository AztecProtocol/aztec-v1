import Aztec from './Aztec';

window.aztec = new Aztec();

const enableSite = async () => {
    const { aztec } = window;
    const enabledSite = await aztec.auth.site.enable({
        graphQLServer: 'http://localhost:4000/',
    });
    console.log(enabledSite);
};

// TODO
// should be called with selected config through extension's UI
if (window.location.hostname.match(/aztecprotocol/)) {
    window.aztec.enable();
    enableSite();
}
