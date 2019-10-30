'use strict';

function useAsset(asset) {
  document.body.setAttribute('asset', asset);
  const createAssetScript = document.createElement('script');
  createAssetScript.src = './asset.js';
  document.body.appendChild(createAssetScript);
}

function useExistingAsset() {
  const asset = document.getElementById('existing-asset-address');
  useAsset(asset.value);
}

async function fetchContract(contractName) {
  const response = await fetch('http://localhost:5555/contracts/' + contractName + '.json');
  return response.json();
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const newAssetStatus = [];
function addAssetStatus(status, keepInLog = false) {
  const elem = document.getElementById('new-asset-status');
  elem.innerHTML = `
    ${newAssetStatus.join('<br/>')}
    ${newAssetStatus.length ? '<br/>' : ''}
    ${status}
  `;
  if (keepInLog) {
    newAssetStatus.push(status);
  }
}

const proofEpoch = 1;
const proofId = 1;
const proofCategoryMapping = {
  JOIN_SPLIT_PROOF: 1,
  MINT_PROOF: 2,
  BURN_PROOF: 3,
};
const proofIdMapping = {
  JOIN_SPLIT_PROOF: '65793',
  MINT_PROOF: '66049',
  BURN_PROOF: '66305',
};

async function setProofInAce(proofName) {
  addAssetStatus(`Checking ${proofName} in ACE...'`);
  const category = proofCategoryMapping[proofName];
  const existingProof = await window.aztec.Web3Service
    .useContract('ACE')
    .method('validators')
    .call(
      proofEpoch,
      category,
      proofId,
    );

  if (!existingProof) {
      addAssetStatus(`Setting ${proofName} in ACE...'`);
      const proof = proofIdMapping[proofName];
      const proofContract = window.aztec.Web3Service
        .registerContract(proofContractMapping[proofName]);

      await window.aztec.Web3Service
        .useContract('ACE')
        .method('setProof')
        .send(
          proof,
          proofContract.address,
        );
      addAssetStatus(`✓ Set ${proofName} in ACE'`, true);
  }
}

async function createAsset() {
  const value = document.getElementById('new-asset-value').value || 0;

  const existingAssetElem = document.getElementById('existing-asset');
  existingAssetElem.style.display = 'none';

  const ERC20Mintable = await fetchContract('ERC20Mintable');
  addAssetStatus('Deploying ERC20Mintable...');
  const deployedERC20 = await window.aztec.Web3Service.deploy(ERC20Mintable);
  const erc20Address = deployedERC20.address;
  addAssetStatus(`✓ ERC20 deployed - ${erc20Address}`, true);

  await setProofInAce('JOIN_SPLIT_PROOF');
  await setProofInAce('MINT_PROOF');
  await setProofInAce('BURN_PROOF');

  addAssetStatus('Deploying ZkAsset...');
  const scalingFactor = document.getElementById('new-asset-scaling-factor').value;
  const aceAddress = window.aztec.Web3Service.contract('ACE').address;
  const ZkAssetOwnable = await fetchContract('ZkAssetOwnable');
  const deployedZkAsset = await window.aztec.Web3Service.deploy(
    ZkAssetOwnable,
    [
      aceAddress,
      erc20Address,
      scalingFactor,
    ],
  );
  const zkAssetAddress = deployedZkAsset.address;
  addAssetStatus(`✓ ZkAsset deployed - ${zkAssetAddress}`, true);

  addAssetStatus('Setting proof in ZkAsset...');
  await window.aztec.Web3Service
    .useContract('ZkAssetOwnable')
    .at(zkAssetAddress)
    .method('setProofs')
    .send(
      1,
      17,
    );
  addAssetStatus('✓ Set proof in ZkAsset', true);

  if (value) {
    const account = window.aztec.Web3Service.account;
    addAssetStatus(`Minting ERC20 with amount = ${value}...`);
    await window.aztec.Web3Service
      .useContract('ERC20')
      .at(erc20Address)
      .method('mint')
      .send(
        account.address,
        value,
      );
    addAssetStatus(`✓ ERC20 balance = ${value}`, true);

    addAssetStatus(`Appoving ACE to spend ${value} from ERC20...`);
    await window.aztec.Web3Service
      .useContract('ERC20')
      .at(erc20Address)
      .method('approve')
      .send(
        aceAddress,
        value,
      );
    addAssetStatus(`✓ Permission to spend ${value} from ERC20 approved`, true);
  }

  addAssetStatus(`✓ ZkAsset created with initial ERC20 balance = ${value}`, true);

  await sleep(500);

  useAsset(zkAssetAddress);
}

document.getElementById('app').innerHTML = `
  <div>
    <div>
      <div>Create a new asset:</div>
      <label>Initial Amount </label>
      <input
        id="new-asset-value"
        type="number"
        size="10"
        value="200"
      /><br/>
      <label>Scaling Factor </label>
      <input
        id="new-asset-scaling-factor"
        type="number"
        size="10"
        value="1"
      /><br/>
      <button onclick="createAsset()">Submit</button><br/>
      <br/>
      <div id="new-asset-status"></div>
    </div>
    <br/>
    <div id="existing-asset">
      <div>Or use an existing asset:</div>
      <label>Address</label>
      <input
        id="existing-asset-address"
        type="text"
        size="42"
        placeholder="asset address"
      />
      <button onclick="useExistingAsset()">Go</button>
    </div>
  </div>
`;
