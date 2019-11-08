'use strict';

const zkAssetAddress = document.body.getAttribute('asset');
let asset;
let allowanceStatus;
let depositStatus;
let withdrawStatus;
let sendStatus;
let fetchStatus;

const makeStatusGenerator = (id) => {
  let statusLogs = [];
  const elem = document.getElementById(id);
  const log = (status, keepInLog = false) => {
    elem.style.color = 'inherit';
    elem.innerHTML = `
      ${statusLogs.map(status => `${status}<br/>`).join('')}
      ${status}<br/>
    `;
    if (keepInLog) {
      statusLogs.push(status);
    }
  };
  const error = (status, keepInLog) => {
    log(status, keepInLog);
    elem.style.color = 'red';
  };
  const clear = () => {
    statusLogs = [];
    elem.innerHTML = '';
  };
  return {
    log,
    error,
    clear,
  };
};

async function refreshBalance() {
  const balance = await asset.balance();
  document.getElementById('asset-balance').innerHTML = `${balance}`;
}

async function refreshAllowance() {
  const account = window.aztec.web3.account();
  const erc20Address = asset.linkedTokenAddress;
  const aceAddress = window.aztec.web3.getAddress('ACE');
  const allowance = await window.aztec.web3
    .useContract('ERC20')
    .at(erc20Address)
    .method('allowance')
    .call(
        account.address,
        aceAddress,
    );
  document.getElementById('erc20-allowance').innerHTML = `${allowance}`;
}

async function refreshERC20Balance() {
  const balance = await asset.balanceOfLinkedToken();
  document.getElementById('erc20-balance').innerHTML = `${balance}`;
}

async function refreshAssetBalances() {
  refreshBalance();
  refreshERC20Balance();
  refreshAllowance();
}

async function initAsset() {
  asset = await window.aztec.asset(zkAssetAddress);
  const apisElem = document.getElementById('asset-apis');
  if (!asset.isValid()) {
    apisElem.innerHTML = 'This asset is not valid.';
  } else {
    allowanceStatus = makeStatusGenerator('allowance-status');
    depositStatus = makeStatusGenerator('deposit-status');
    withdrawStatus = makeStatusGenerator('withdraw-status');
    sendStatus = makeStatusGenerator('send-status');
    fetchStatus = makeStatusGenerator('fetch-status');
    refreshAssetBalances();
  }
  apisElem.style.display = 'block';
}

async function approveAllowance() {
  const allowanceInput = document.getElementById('erc20-allowance-value');
  const value = parseInt(allowanceInput.value);
  if (!value) {
    allowanceStatus.error('× Allowance value must be larger than 0');
    return;
  }

  allowanceStatus.clear();

  const aceAddress = window.aztec.web3.getAddress('ACE');
  const erc20Address = asset.linkedTokenAddress;
  await window.aztec.web3
    .useContract('ERC20')
    .at(erc20Address)
    .method('approve')
    .send(
      aceAddress,
      value,
    );

  await refreshAllowance();
  allowanceInput.value = '';
}

async function deposit() {
  const depositInput = document.getElementById('deposit-value');
  const numberOfOutputNotes = parseInt(document.getElementById('deposit-output-number').value, 10);
  const value = parseInt(depositInput.value);
  if (!value) {
    depositStatus.error('× Deposit value must be larger than 0');
    return;
  }
  if (!numberOfOutputNotes) {
    depositStatus.error('× Number of output notes must be more than 0');
    return;
  }

  depositStatus.clear();

  const erc20Balance = await asset.balanceOfLinkedToken();
  if (erc20Balance < value) {
    depositStatus.error(`ERC20 balance (${erc20Balance}) is not enough to make a deposit of ${value}.`);
    return;
  }

  const account = window.aztec.web3.account();
  try {
    await asset.deposit(
      [
        {
          amount: value,
          to: account.address,
        },
      ],
      {
        numberOfOutputNotes,
      },
    );
    refreshAssetBalances();
    depositInput.value = '';
  } catch (error) {
    depositStatus.error(error.message);
  }
}

async function withdraw() {
  const withdrawInput = document.getElementById('withdraw-value');
  const numberOfInputNotes = parseInt(document.getElementById('withdraw-input-number').value, 10);
  const value = parseInt(withdrawInput.value);
  if (!value) {
    withdrawStatus.error('× Withdraw value must be larger than 0');
    return;
  }
  if (!numberOfInputNotes) {
    withdrawStatus.error('× Number of input notes must be more than 0');
    return;
  }

  withdrawStatus.clear();

  const balance = await asset.balance();
  if (balance < value) {
    withdrawStatus.error(`× Asset balance (${balance}) is not enough to make a withdraw of ${value}.`);
    return;
  }

  const account = window.aztec.web3.account();
  const transactions = [
    {
      amount: value,
      to: account.address,
    },
  ];

  try {
    await asset.withdraw(
      transactions,
      {
          numberOfInputNotes,
      },
    );

    refreshAssetBalances();
    withdrawInput.value = '';
  } catch (error) {
    withdrawStatus.error(error.message);
  }
}

async function send() {
  const addressInput = document.getElementById('send-address');
  let numberOfInputNotes = document.getElementById('send-input-number').value.trim();
  numberOfInputNotes = numberOfInputNotes === ''
    ? undefined
    : parseInt(numberOfInputNotes);
  let numberOfOutputNotes = document.getElementById('send-output-number').value.trim();
  numberOfOutputNotes = numberOfOutputNotes === ''
    ? undefined
    : parseInt(numberOfOutputNotes);
  const valueInput = document.getElementById('send-value');
  const address = addressInput.value.trim();
  const value = parseInt(valueInput.value.trim());
  if (!address) {
    sendStatus.error('Please enter an address');
    return;
  }
  if (value <= 0) {
    sendStatus.error('Value must be larger than 0');
    return;
  }

  sendStatus.clear();

  const balance = await asset.balance();
  if (balance < value) {
    sendStatus.error(`Asset balance (${balance}) is not enough.`);
    return;
  }

  const account = window.aztec.web3.account();

  try {
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
        numberOfInputNotes,
        numberOfOutputNotes,
      },
    );

    refreshAssetBalances();
    addressInput.value = '';
    valueInput.value = '';
  } catch (error) {
    sendStatus.error(error.message);
  }
}

async function fetchNotesFromBalance() {
  fetchStatus.clear();

  let equalTo = document.getElementById('fetch-eq-value').value.trim();
  equalTo = equalTo === ''
    ? undefined
    : parseInt(equalTo);
  let greaterThan = document.getElementById('fetch-gt-value').value.trim();
  greaterThan = greaterThan === ''
    ? undefined
    : parseInt(greaterThan);
  let lessThan = document.getElementById('fetch-lt-value').value.trim();
  lessThan = lessThan === ''
    ? undefined
    : parseInt(lessThan);
  let numberOfNotes = document.getElementById('fetch-count-value').value.trim();
  numberOfNotes = numberOfNotes === ''
    ? undefined
    : parseInt(numberOfNotes);

  let notes;
  try {
    notes = await asset.fetchNotesFromBalance({
      equalTo,
      lessThan,
      greaterThan,
      numberOfNotes,
    });
  } catch (error) {
    fetchStatus.error(error.message);
    return;
  }

  if (!notes.length) {
    fetchStatus.log('Cannot find any notes that meet the requirements.');
  } else {
    fetchStatus.log(`Found ${notes.length} note${notes.length === 1 ? '' : 's'}:`, true);
    notes.forEach(({
      noteHash,
      value,
    }) => {
      fetchStatus.log(`${value} - ${noteHash}`, true);
    });
  }
}

document.getElementById('app').innerHTML = `
  <div>
    <div>
      Asset: <strong>${zkAssetAddress}</strong><br/>
      Balance: <span id="asset-balance">...</span><br/>
    </div>
    <br/>
    <div>
      Linked ERC20: <strong>${zkAssetAddress}</strong><br/>
      Balance: <span id="erc20-balance">...</span><br/>
      Allowance: <span id="erc20-allowance">...</span><br/>
    </div>
    <br/>
    <br/>
    <div id="asset-apis" style="display: none;">
      <div>
        <div>Approve ERC20 allowance:</div>
        <label>Amount</label>
        <input
          id="erc20-allowance-value"
          type="number"
          size="10"
        /><br/>
        <button onclick="approveAllowance()">Submit</button><br/>
        <br/>
        <div id="allowance-status"></div>
      </div>
      <br/>
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
          value="2"
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
        <label>Number of input notes</label>
        <input
          id="send-input-number"
          type="number"
          size="2"
          value="2"
        /><br/>
        <label>Number of output notes</label>
        <input
          id="send-output-number"
          type="number"
          size="2"
          value="2"
        /><br/>
        <button onclick="send()">Submit</button><br/>
        <br/>
        <div id="send-status"></div>
      </div>
    </div>
    <br/>
    <div>
      <div>Fetch note from balance:</div>
      <label>Equal to</label>
      <input
        id="fetch-eq-value"
        type="number"
        size="10"
      /><br/>
      <label>Greater than</label>
      <input
        id="fetch-gt-value"
        type="number"
        size="10"
        value="0"
      /><br/>
      <label>Less than</label>
      <input
        id="fetch-lt-value"
        type="number"
        size="10"
        value="100"
      /><br/>
      <label>Number of notes</label>
      <input
        id="fetch-count-value"
        type="number"
        size="10"
        value="1"
      /><br/>
      <button onclick="fetchNotesFromBalance()">Submit</button><br/>
      <br/>
      <div id="fetch-status"></div>
    </div>
  </div>
`;

initAsset();
