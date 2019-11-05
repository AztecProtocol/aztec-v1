'use strict';

const zkAssetAddress = document.body.getAttribute('asset');
let asset;
let depositStatus;
let withdrawStatus;
let sendStatus;

const makeStatusGenerator = (id) => {
  let statusLogs = [];
  const elem = document.getElementById(id);
  const log = (status, keepInLog = false) => {
    elem.innerHTML = `
      ${statusLogs.map(status => `${status}<br/>`).join('')}
      ${status}<br/>
    `;
    if (keepInLog) {
      statusLogs.push(status);
    }
  };
  const clear = () => {
    statusLogs = [];
    elem.innerHTML = '';
  };
  return {
    log,
    clear,
  };
};

async function refreshBalance() {
  const balance = await asset.balance();
  document.getElementById('asset-balance').innerHTML = `${balance}`;
}

async function refreshERC20Balance() {
  const balance = await asset.balanceOfLinkedToken();
  document.getElementById('erc20-balance').innerHTML = `${balance}`;
}

function refreshAssetBalances() {
  refreshBalance();
  refreshERC20Balance();
}

async function initAsset() {
  asset = await window.aztec.asset(zkAssetAddress);
  const apisElem = document.getElementById('asset-apis');
  if (!asset.isValid()) {
    apisElem.innerHTML = 'This asset is not valid.';
  } else {
    depositStatus = makeStatusGenerator('deposit-status');
    withdrawStatus = makeStatusGenerator('withdraw-status');
    sendStatus = makeStatusGenerator('send-status');
    refreshAssetBalances();
  }
  apisElem.style.display = 'block';
}

async function deposit() {
  const depositInput = document.getElementById('deposit-value');
  const numberOfOutputNotes = parseInt(document.getElementById('deposit-output-number').value, 10);
  const value = parseInt(depositInput.value);
  if (!value) {
    depositStatus.log('× Deposit value must be larger than 0');
    return;
  }
  if (!numberOfOutputNotes) {
    depositStatus.log('× Number of output notes must be more than 0');
    return;
  }

  depositStatus.clear();

  const erc20Balance = await asset.balanceOfLinkedToken();
  if (erc20Balance < value) {
    depositStatus.log(`ERC20 balance (${erc20Balance}) is not enough to make a deposit of ${value}.`);
    return;
  }

  const account = window.aztec.web3.account();
  await asset.deposit([
    {
      amount: value,
      to: account.address,
    },
  ]);

  refreshAssetBalances();
  depositInput.value = '';
}

async function withdraw() {
  const withdrawInput = document.getElementById('withdraw-value');
  const numberOfInputNotes = parseInt(document.getElementById('withdraw-input-number').value, 10);
  const value = parseInt(withdrawInput.value);
  if (!value) {
    withdrawStatus.log('× Withdraw value must be larger than 0');
    return;
  }
  if (!numberOfInputNotes) {
    withdrawStatus.log('× Number of input notes must be more than 0');
    return;
  }

  withdrawStatus.clear();

  const balance = await asset.balance();
  if (balance < value) {
    withdrawStatus.log(`× Asset balance (${balance}) is not enough to make a withdraw of ${value}.`);
    return;
  }

  const account = window.aztec.web3.account();
  const transactions = [
    {
      amount: value,
      to: account.address,
    },
  ];
  await asset.withdraw(
    transactions,
    {
        numberOfInputNotes,
    },
  );

  refreshAssetBalances();
  withdrawInput.value = '';
}

async function send() {
  const addressInput = document.getElementById('send-address');
  const valueInput = document.getElementById('send-value');
  const address = addressInput.value;
  const value = parseInt(valueInput.value);
  if (!address || !value) {
    return;
  }

  sendStatus.clear();

  const balance = await asset.balance();
  if (balance < value) {
    sendStatus.log(`Asset balance (${balance}) is not enough.`);
    return;
  }

  const account = window.aztec.web3.account();
  await asset.send(
    [
      {
        to: address,
        amount: value,
      },
    ],
    {
      from: account.address,
      sender: account.address,
    },
  );

  refreshAssetBalances();
  addressInput.value = '';
  valueInput.value = '';
}

document.getElementById('app').innerHTML = `
  <div>
    <div>
      Asset: <strong>${zkAssetAddress}</strong><br/>
      ERC20 balance: <span id="erc20-balance">...</span><br/>
      Balance: <span id="asset-balance">...</span><br/>
    </div>
    <br/>
    <div id="asset-apis" style="display: none;">
      <div>
        <div>Deposit:</div>
        <label>Amount</label>
        <input
          id="deposit-value"
          type="number"
          size="10"
        /><br/>
        <label>Number of output notes</label>
        <input
          id="deposit-output-number"
          type="number"
          size="2"
          value="2"
        /><br/>
        <button onclick="deposit()">Submit</button><br/>
        <br/>
        <div id="deposit-status"></div>
      </div>
      <br/>
      <div>
        <div>Withdraw:</div>
        <label>Amount</label>
        <input
          id="withdraw-value"
          type="number"
          size="10"
        /><br/>
        <label>Number of input notes</label>
        <input
          id="withdraw-input-number"
          type="number"
          size="2"
          value="1"
        /><br/>
        <button onclick="withdraw()">Submit</button><br/>
        <br/>
        <div id="withdraw-status"></div>
      </div>
      <br/>
      <div>
        <div>Send:</div>
        <label>To</label>
        <input
          id="send-address"
          type="text"
          size="42"
        /><br/>
        <label>Amount</label>
        <input
          id="send-value"
          type="number"
          size="10"
        /><br/>
        <button onclick="send()">Submit</button><br/>
        <br/>
        <div id="send-status"></div>
      </div>
    </div>
  </div>
`;

initAsset();
