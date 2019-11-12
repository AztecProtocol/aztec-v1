const Web3 = require('web3');
const axios = require('axios');
const { getRelayHub, isRelayHubDeployed, fundRecipient, balance } = require('@openzeppelin/gsn-helpers');
const { GSNDevProvider } = require('@openzeppelin/gsn-provider');
const { toWei } = require('web3-utils');
const {
    expect,
} = require('chai');
const {
    JoinSplitProof,
    ProofUtils,
} = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');

const ACE = require('../../build/contracts/ACE');
const ERC20Mintable = require('../../build/contracts/ERC20Mintable');
const ZkAsset = require('../../build/contracts/ZkAsset');
const AZTECAccountRegistryGSN = require('../../build/contracts/AZTECAccountRegistryGSN');

const helpers = require('../helpers/ERC1724');
const contractAddress = require('../helpers/contractAddress');

const aztecAccount = secp256k1.generateAccount();

describe('ZkAsset with GSN', () => {
    const SIGNING_PROVIDER = 'https://bv9t4hwozi.execute-api.us-east-1.amazonaws.com';
    const WEB3_PROVIDER_URL = 'http://127.0.0.1:8545';
    const web3 = new Web3(WEB3_PROVIDER_URL);
    const trustedAddress = '0x6794d16143e537a51d6745D3ae6bc99502b4331C';
    let networkId;
    const scalingFactor = 10;
    const amount = toWei('1');
    let ace;
    let erc20;
    let zkAsset;
    let gsnProvider;

    const RELAY_HUB_ADDRESS = '0xd216153c06e857cd7f72665e0af1d7d82172f494'; // constant across development, testnets and mainnet
    let owner;
    let relayer;
    let sender;
    let accountRegistry;

    const setupAccount = async () => {
        const accounts = await web3.eth.getAccounts();
        [
            owner,
            relayer,
            sender,
        ] = accounts;
    };

    const setupNetwork = async () => {
        networkId = await web3.eth.net.getId();
    }

    const approveFunction = async ({
        from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
    }) => {
        let response;
        try {
            response = await axios.post(`${SIGNING_PROVIDER}/Stage/sign-data`, {
                data: {
                    from, to, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayerAddress, relayHubAddress,
                },
                apiKey: 'someKey',
            });
        } catch (error) {
            console.error(error);
        }

        console.log(response.data);

        return response.data.data.dataSignature;
    };

    before(async () => {
        await setupAccount();
        await setupNetwork();

        gsnProvider = new GSNDevProvider('http://localhost:8545', {
            ownerAddress: owner,
            relayerAddress: relayer,
            useGNS: true,
        });

        const aceAddress = contractAddress(ACE, networkId);
        ace = new web3.eth.Contract(ACE.abi, aceAddress);

        const accountRegistryTemplate = new web3.eth.Contract(AZTECAccountRegistryGSN.abi, null, { data: AZTECAccountRegistryGSN.bytecode });
        accountRegistry = await accountRegistryTemplate
            .deploy({ arguments: [aceAddress, trustedAddress] })
            .send({ from: owner, gas: 6e6 });

        accountRegistry.setProvider(gsnProvider);
    });

    beforeEach(async () => {
        const Erc20Template = new web3.eth.Contract(ERC20Mintable.abi, null, { data: ERC20Mintable.bytecode });
        erc20 = await Erc20Template
            .deploy()
            .send({ from: owner, gas: 6e6 });

        await erc20.methods.mint(sender, amount)
            .send({ from: owner, gas: 6e6 });

        await erc20.methods.approve(ace.options.address, amount)
            .send({ from: sender, gas: 6e6 });

        // await erc20.methods.mint(accountRegistry.options.address, amount)
        //     .send({ from: owner, gas: 6e6 });

        // await accountRegistry.methods.approve(erc20.options.address, ace.options.address, amount)
        //     .send({ from: sender, gas: 6e6, useGSN: false });

        const zkAssetTemplate = new web3.eth.Contract(ZkAsset.abi, null, { data: ZkAsset.bytecode });
        zkAsset = await zkAssetTemplate
            .deploy({ arguments: [ace.options.address, erc20.options.address, scalingFactor] })
            .send({ from: owner, gas: 6e6 });

        // Register the zkAsset in  the hub, and fund it so it can pay for meta transactions
        await fundRecipient(web3, {
            recipient: accountRegistry.options.address,
            amount,
            from: owner,
        });
    });

    describe('Success states', async () => {
        it('should setup AZTECAccountRegistry to use GSN', async () => {
            // eslint-disable-next-line no-underscore-dangle
            const gsnStatus = accountRegistry._provider.useGSN;
            expect(gsnStatus).to.equal(true);
        });

        it('should deploy relay hub', async () => {
            const deployStatus = await isRelayHubDeployed(web3);
            const relayHub = await getRelayHub(web3, RELAY_HUB_ADDRESS);
            expect(deployStatus).to.equal(true);
            expect(relayHub).to.not.equal(undefined);
        });

        it('should have AZTECAccountRegistry contract gas balance', async () => {
            const relayHub = await getRelayHub(web3, RELAY_HUB_ADDRESS);
            const recipientBalance = await relayHub.methods
                .balanceOf(accountRegistry.options.address)
                .call({ from: sender, gas: 5e6 });
            const relayHubBalance = await web3.eth.getBalance(RELAY_HUB_ADDRESS);
            expect(parseInt(recipientBalance, 10)).to.equal(parseInt(amount, 10));
            expect(parseInt(recipientBalance, 10)).to.equal(parseInt(relayHubBalance, 10));
        });

        it('should send confidentialTransfer() tx via the GSN', async () => {
            // const initialRecipientFunds = await balance(web3, { recipient: zkAsset.options.address });
            const depositInputNotes = [];
            const notesValues = [20, 10];
            const depositOutputNotes = await helpers.getNotesForAccount(aztecAccount, notesValues);
            const publicValue = ProofUtils.getPublicValue(
                [],
                notesValues,
            );
            const publicOwner = sender;
            const registryAddress = accountRegistry.options.address;

            const depositProof = new JoinSplitProof(depositInputNotes, depositOutputNotes, registryAddress, publicValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAsset.options.address);

            const receiptApprove = await ace.methods.publicApprove(zkAsset.options.address, depositProof.hash, 30).send({ from: sender  });
            expect(receiptApprove.status).to.equal(true);

            const receipt = await accountRegistry.methods.confidentialTransferFrom(zkAsset.options.address, depositData).send({
                from: sender,
                gas: 8e6,
                approveFunction,
            });
            expect(receipt.status).to.equal(true);

            // const postTxRecipientFunds = await balance(web3, { recipient: accountRegistry.options.address });
            // expect(parseInt(postTxRecipientFunds, 10)).to.be.below(parseInt(initialRecipientFunds, 10));
        });
    });

    // describe('Failure states', async () => {
    //     it('should reject an unbalanced proof');
    // });
});
