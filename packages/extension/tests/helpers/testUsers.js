export const userAccount = {
    address: '0x7759aecfeea21244bd603009c133c8ee9fb59e29',
    linkedPublicKey: '0x0abbf57bcdc738fac31294140f6959500465827236c5b69252247c534e4a001b',
    linkedPrivateKey: 'bce9ac92da072db6bd5336547bb6b77f8c7e0502d468013d41235c34d7185653',
    spendingPublicKey: '0x02f587a64247349e4f388f51175fbcd4d6daad9d967d9e646ff708f400e9a39a5d',
};

export const userAccount2 = {
    address: '0x27b60ccecad263fd6ba595c68ad0e4c968ad9c67',
    linkedPublicKey: '0xe0eeeb03914dad6dcd2384f4d14fdbbc1a538954f156a55cb8a04a6bd72b4148',
    linkedPrivateKey: '28c7771738a58d5f6628471f96d430281033e981ccd3590362fe7db361fe3ece',
    spendingPublicKey: '0x0359d8321e50133ce30f805519b728018ae180db0376de2f210c5570975c642bdb',
};

export const registrationData = {
    password: '5d4hl6xv5r',
    salt: 'y29qm2',
    address: '0x7759aecfeea21244bd603009c133c8ee9fb59e29',
    seedPhrase: 'long dragon example coconut sound yard patient cool ski organ cigar myth',
};

const pwDerivedKeyStr = '{"0":35,"1":96,"2":127,"3":54,"4":16,"5":250,"6":37,"7":142,"8":252,"9":144,"10":88,"11":25,"12":144,"13":230,"14":29,"15":110,"16":162,"17":79,"18":226,"19":20,"20":67,"21":44,"22":246,"23":5,"24":145,"25":161,"26":144,"27":73,"28":152,"29":98,"30":48,"31":48}';

export const pwDerivedKey = new Uint8Array(Object.values(JSON.parse(pwDerivedKeyStr)));
