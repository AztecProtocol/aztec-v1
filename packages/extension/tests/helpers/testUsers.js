export const userAccount = {
    address: '0xfB95acC8D3870da3C646Ae8c3C621916De8DF42d',
    linkedPublicKey: '0xa61d17b0dd3095664d264628a6b947721314b6999aa6a73d3c7698f041f78a4d',
    linkedPrivateKey: 'e1ec35b90155a633ac75d0508e537a7e00fd908a5295365054001a44b4a0560c',
    spendingPublicKey: '0x0290e0354caa04c73920339f979cfc932dd3d52ba8210fec34571bb6422930c396',
};

export const userAccount2 = {
    address: '0x61EeAd169ec67b24abee7B81Ca750b6dCA3a9CCd',
    linkedPublicKey: '0x058d55269a83b5ea379931ac58bc3def375eab12e527708111545af46f5f9b5c',
    linkedPrivateKey: '6a30cc7b28b037b47378522a1a370c2394b0dd2d70c6abbe5ac66c8a1d84db21',
    spendingPublicKey: '0x02090a6b89b0588626f26babc87f2dc1e2c815b8248754bed93d837f7071411605',
};

export const registrationData = {
    keyStore: {
        salt: '2j363t',
        hdPathString: 'm/44\'/60\'/0\'/0',
        encSeed: {
            encStr: 'O5zY4bwug1FuDdXFooOLgRNO5YoDFKhV4kWfDuWQrAUXIW65EDtmaCAmPSiSoSpnfPGheL6e3tyVdXA+uvZJuJWdDQ6az2OPIrJXmjCHZWcVDQzkvmpH7CvQ+PrucfbwdAzeAERocKR/GAWtrUpXbS2l2Ustq7OodK/9zK/Oz1SByt6QIHJvjg==',
            nonce: 'rqXuJCcvFfP07MDUk5v3sjtA7hQOk67n',
        },
        encHdRootPriv: {
            encStr: 'VAw+Bh38syXEsDx/J7ZjZ9bi7A5d2cD/r1VSF4xfTwHOSRHeR2nDkOrnApy1q2MVZvh4BTbKrC7zRwu8Q6Ek1zZ5grCe9v30ruhLKYmheGlETmfCJBBussuI1pjzKLYzaj8Q4Hu1hcqsSg3k1ssGkGqyRP25W1IMHnhQ9G3RWw==',
            nonce: 'QoOtC2VAXcWSecOpdO7/Eaaxs0SQvQrt',
        },
        hdIndex: 1,
        privacyKeys: {
            publicKey: '0xa61d17b0dd3095664d264628a6b947721314b6999aa6a73d3c7698f041f78a4d',
            encPrivKey: {
                encStr: 'btFoyZu6ERG0fiAnbnuoHX2QYAjAJplOeg3Aq/hTJDAA70Cc8i/q6VfpTnnmOMKPJ3hkE4Zn7jkp8Hd4tbnj7pa/1inanMkIgf+xF3ReD4E=',
                nonce: 'vtfBV0aT+tAYnZllHUS25Ukejh+mJiec',
            },
        },
    },
    pwDerivedKey: {
        0: 21,
        1: 226,
        2: 28,
        3: 149,
        4: 191,
        5: 15,
        6: 237,
        7: 208,
        8: 177,
        9: 210,
        10: 69,
        11: 239,
        12: 96,
        13: 52,
        14: 22,
        15: 178,
        16: 104,
        17: 217,
        18: 228,
        19: 116,
        20: 113,
        21: 232,
        22: 70,
        23: 218,
        24: 51,
        25: 255,
        26: 0,
        27: 238,
        28: 218,
        29: 26,
        30: 186,
        31: 208,
    },
};

const pwDerivedKeyStr = '{"0":21,"1":226,"2":28,"3":149,"4":191,"5":15,"6":237,"7":208,"8":177,"9":210,"10":69,"11":239,"12":96,"13":52,"14":22,"15":178,"16":104,"17":217,"18":228,"19":116,"20":113,"21":232,"22":70,"23":218,"24":51,"25":255,"26":0,"27":238,"28":218,"29":26,"30":186,"31":208}';

export const pwDerivedKey = new Uint8Array(Object.values(JSON.parse(pwDerivedKeyStr)));

export const password = '5s1l4b1w5z';
