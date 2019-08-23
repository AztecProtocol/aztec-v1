export const userAccount = {
    address: '0x3339c3c842732f4daacf12aed335661cf4eab66b',
    linkedPublicKey: '0xcb7d4f2263555d45d78a18d7a6212461face2868451c40d36e4b31a22f4d3557',
    spendingPublicKey: '0x03c8acc47a845da7b180e71f0c800e1cea70beb8b1df7699eb92df3f2927cc13e9',
};

export const userAccount2 = {
    address: '0x0563a36603911daab46a3367d59253badf500bf9',
    linkedPublicKey: '0x5cf16cd7ec26d46d7119927c822547a040f1a000d41a12adf72393a84712cf9d',
    spendingPublicKey: '0x969bed11087acdef86d85f60fd099885ba26455fb11be5d2abd39daff12d80d025',
};

export const registrationData = {
    password: 'password01',
    salt: 'sss',
    address: userAccount.address,
    seedPhrase: 'sunny rival motion enforce misery retreat cram acid define use they purpose',
};

export const registeredUserInfo = {
    address: userAccount.address,
    linkedPublicKey: userAccount.linkedPublicKey,
    registeredAt: Date.now(),
};

export const domainName = 'aztecprotocol.com';

export const requiredArgs = {
    currentAddress: userAccount.address,
    domain: domainName,
};

const pwDerivedKeyStr = '{"0":211,"1":61,"2":240,"3":54,"4":249,"5":226,"6":108,"7":239,"8":98,"9":215,"10":253,"11":84,"12":54,"13":241,"14":246,"15":81,"16":242,"17":83,"18":145,"19":65,"20":0,"21":14,"22":240,"23":120,"24":1,"25":228,"26":188,"27":177,"28":106,"29":159,"30":253,"31":43}';
export const pwDerivedKey = new Uint8Array(Object.values(JSON.parse(pwDerivedKeyStr)));
