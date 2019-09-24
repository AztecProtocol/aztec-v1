import metadata, {
} from '~utils/metadata';


describe('Retrive ViewingKeys From Meta', () => {
    const rawNote2 = {
        noteHash: '0x1aa490cf5c2a2fae92bc85f29aed4ce231a3ff6789bb1251085f155b2cefb345',
        owner: '0x63dc60431225e19bdea96fb9270fda055ff9540d',
        metadata: '0x89f24c99b79d7fde2843302320e60d09823c5ba8e4f7ddbcc3763d88dc92dfec93087ad01d937df9179b02c4938de40def28ea20290032f1f7340755722930f94e2cad3e7e045ec248034753a3efdf0259def36eb5eff950ceda2c81386db25e0100000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000000000010100000000000000000000000000000000000000000000000000000000000001f3000000000000000000000000000000000000000000000000000000000000000100000000000000000000000063dc60431225e19bdea96fb9270fda055ff9540d000000000000000000000000000000000000000000000000000000000000000156366a52407e4580908aceea7f24d3df480a5d3fd42dd3ad25c06c4d144b7c9bd4c12ea42af494f7a47cc343d745cf7c91dae77f94a53501ee0d381cdcabf0a550be002f76842cc3c77f2cb1a69e362268b0347ecb79c9b2742465f81760fdeade05075cd7c40156e69b14beb54f7237993e195369ffde3d64408bc31c96740ef922f123e09688adbcfd671efef120089717c5131eaa2fcd44c5e775d1d7d7fe856ec1826b1f75672d3a6f997a8a3dec54b6e799012533b978ec8b318ae7ba88f756847f94050510890c4a3b8901a312ce110000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        asset: '0x5424',
    };

    it.only('should retrive viewingKeys', async () => {
        const metadataObj = metadata(rawNote2.metadata);
        const {
            addresses: addressesRetrieved,
            viewingKeys: viewingKeysRetrieved,
        } = metadataObj;

        console.log(`addressesRetrieved: ${JSON.stringify(addressesRetrieved)}`);
        console.log(`viewingKeysRetrieved: ${JSON.stringify(viewingKeysRetrieved)}`);

        expect(addressesRetrieved.length).toBeGreaterThan(0);
        expect(addressesRetrieved.includes(rawNote2.owner)).toBeTruthy();
        expect(viewingKeysRetrieved.length).toBeGreaterThan(0);
    });
});
