'use strict';

const zkAssetAddress = document.body.getAttribute('asset');
const {
    address: accountAddress,
} = window.aztec.web3.account();
let asset;
let allowanceStatus;
let depositStatus;
let withdrawStatus;
let sendStatus;
let fetchStatus;
let createStatus;

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
  const allowance = await asset.allowanceOfLinkedToken();
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
    apisElem.style.color = 'red';
  } else {
    allowanceStatus = makeStatusGenerator('allowance-status');
    depositStatus = makeStatusGenerator('deposit-status');
    withdrawStatus = makeStatusGenerator('withdraw-status');
    sendStatus = makeStatusGenerator('send-status');
    fetchStatus = makeStatusGenerator('fetch-status');
    createStatus = makeStatusGenerator('create-status');
    document.getElementById('linked-erc20-address').innerHTML = asset.linkedTokenAddress;
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
  const numberOfOutputNotes = parseInt(document.getElementById('deposit-output-number').value, 10);
  const toAddress = document.getElementById('deposit-to-address').value;
  const depositInput = document.getElementById('deposit-value');
  const value = parseInt(depositInput.value, 10);

  depositStatus.clear();

  try {
    await asset.deposit(
      [
        {
          amount: value,
          to: toAddress,
        },
      ],
      {
        numberOfOutputNotes,
      },
    );
    refreshAssetBalances();
    depositInput.value = '';
  } catch (error) {
    console.error(error);
    depositStatus.error(error.message);
  }
}

async function withdraw() {
  const withdrawInput = document.getElementById('withdraw-value');
  const toAddress = document.getElementById('withdraw-to-address').value;
  const numberOfInputNotes = parseInt(document.getElementById('withdraw-input-number').value, 10);
  const value = parseInt(withdrawInput.value, 10);

  withdrawStatus.clear();

  const account = window.aztec.web3.account();

  try {
    await asset.withdraw(
      value,
      {
          to: toAddress,
          numberOfInputNotes,
      },
    );

    refreshAssetBalances();
    withdrawInput.value = '';
  } catch (error) {
    console.error(error);
    withdrawStatus.error(error.message);
  }
}

async function send() {
  let numberOfInputNotes = document.getElementById('send-input-number').value.trim();
  numberOfInputNotes = numberOfInputNotes === ''
    ? undefined
    : parseInt(numberOfInputNotes);
  let numberOfOutputNotes = document.getElementById('send-output-number').value.trim();
  numberOfOutputNotes = numberOfOutputNotes === ''
    ? undefined
    : parseInt(numberOfOutputNotes);
  const valueInput = document.getElementById('send-value');
  const address = document.getElementById('send-address').value.trim();
  const value = parseInt(valueInput.value.trim(), 10);

  sendStatus.clear();

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
        numberOfInputNotes,
        numberOfOutputNotes,
      },
    );

    refreshAssetBalances();
    valueInput.value = '';
  } catch (error) {
    console.error(error);
    sendStatus.error(error.message);
  }
}

async function createNoteFromBalance() {
  createStatus.clear();

  let numberOfInputNotes = document.getElementById('create-input-number').value.trim();
  numberOfInputNotes = numberOfInputNotes === ''
    ? undefined
    : parseInt(numberOfInputNotes);
  let numberOfOutputNotes = document.getElementById('create-output-number').value.trim();
  numberOfOutputNotes = numberOfOutputNotes === ''
    ? undefined
    : parseInt(numberOfOutputNotes);
  const valueInput = document.getElementById('create-amount');
  const value = parseInt(valueInput.value.trim());
  const userAccess = [];
  for (let i = 0; i < 10; i += 1) {
    const elem = document.getElementById(`create-access-${i}`);
    if (!elem) break;
    userAccess.push(elem.value);
  }

  const account = window.aztec.web3.account();

  try {
    await asset.createNoteFromBalance(
      value,
      {
        owner,
        numberOfInputNotes,
        numberOfOutputNotes,
      },
    );

    refreshAssetBalances();
    valueInput.value = '';
  } catch (error) {
    console.error(error);
    createStatus.error(error.message);
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
    console.error(error);
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
      Linked ERC20: <strong id="linked-erc20-address"></strong><br/>
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
        <label>To</label>
        <input
          id="deposit-to-address"
          type="text"
          size="42"
          value="${accountAddress}"
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
        <label>To</label>
        <input
          id="withdraw-to-address"
          type="text"
          size="42"
          value="${accountAddress}"
        /><br/>
        <button onclick="withdraw()">Submit</button><br/>
        <br/>
        <div id="withdraw-status"></div>
      </div>
      <br/>
      <div>
        <div>Send:</div>
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
        <label>To</label>
        <input
          id="send-address"
          type="text"
          size="42"
          value="${accountAddress}"
        /><br/>
        <button onclick="send()">Submit</button><br/>
        <br/>
        <div id="send-status"></div>
      </div>
      <br/>
      <div>
        <div>Create note from balance:</div>
        <label>Amount</label>
        <input
          id="create-amount"
          type="number"
          size="10"
        /><br/>
        <label>Number of input notes</label>
        <input
          id="create-input-number"
          type="number"
          size="2"
          value="2"
        /><br/>
        <label>Number of output notes</label>
        <input
          id="create-output-number"
          type="number"
          size="2"
          value="2"
        /><br/>
        <label>Share note access with</label>
        <input
          id="create-access-0"
          type="text"
          size="42"
        /><br/>
        <button onclick="createNoteFromBalance()">Submit</button><br/>
        <br/>
        <div id="create-status"></div>
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
  </div>
`;

initAsset();
