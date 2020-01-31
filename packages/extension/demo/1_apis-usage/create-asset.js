'use strict';

(() => {
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

  async function createAsset() {
    const value = document.getElementById('new-asset-value').value || 0;

    const existingAssetElem = document.getElementById('existing-asset');
    existingAssetElem.style.display = 'none';

    const ERC20Mintable = await fetchContract('ERC20Mintable');
    addAssetStatus('Deploying ERC20Mintable...');
    const deployedERC20 = await window.aztec.web3.deploy(ERC20Mintable);
    const erc20Address = deployedERC20.address;
    addAssetStatus(`✓ ERC20 deployed - ${erc20Address}`, true);

    addAssetStatus('Deploying zkAsset...');
    const scalingFactor = document.getElementById('new-asset-scaling-factor').value;
    const aceAddress = window.aztec.web3.getAddress('ACE');
    const ZkAsset = await fetchContract('ZkAssetOwnable');
    const deployedZkAsset = await window.aztec.web3.deploy(
      ZkAsset,
      [
        aceAddress,
        erc20Address,
        scalingFactor,
      ],
    );
    const zkAssetAddress = deployedZkAsset.address;
    addAssetStatus(`✓ zkAsset deployed - ${zkAssetAddress}`, true);

    if (value) {
      const account = window.aztec.web3.account();
      addAssetStatus(`Minting ERC20 with amount = ${value}...`);
      await window.aztec.web3
        .useContract('ERC20')
        .at(erc20Address)
        .method('mint')
        .send(
          account.address,
          value,
        );
      addAssetStatus(`✓ ERC20 balance = ${value}`, true);
    }

    addAssetStatus(`✓ zkAsset created with initial ERC20 balance = ${value}`, true);

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
        <button id="create-asset-button">Submit</button><br/>
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
        <button id="use-existing-asset-button">Go</button>
      </div>
    </div>
  `;

  document.getElementById('create-asset-button')
    .addEventListener('click', createAsset);

  document.getElementById('use-existing-asset-button')
    .addEventListener('click', useExistingAsset);
})();
