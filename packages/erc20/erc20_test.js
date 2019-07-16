const path = require('path');
const { Runtime, getNewVM } = require('../huff/src/runtime.js');
const BN = require('bn.js');
const huffPath = path.posix.resolve(__dirname, './huff_modules');
const main = new Runtime('erc20_test.huff', huffPath);
const vm = getNewVM();

const logSteps = false;
const showGasCost = true;

if (logSteps) {
	vm.on('step', function(data) {
		console.log(`Opcode: ${data.opcode.name}\tStack: ${data.stack}`)
	});
}

async function init(caller_address, total_supply) {
	const calldata = [{index: 0, value: new BN(total_supply), len: 32},];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = caller_address;
	let data = await main(vm, 'ERC20', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Initialised ERC20 with balance ${total_supply} at address 0x${caller_address.toString(16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function get_total_supply() {
	const calldata = [{index: 0, value: 0x18160ddd, len: 4},];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = 0; // callerAddr doesn't matter
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log('*** Checked total ERC20 token supply:');
	console.log(`Total = ${parseInt(data.returnValue.toString("hex"), 16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function get_balance_of(balance_address) {
	const calldata = [{index: 0, value: 0x70a08231, len: 4}, {index: 4, value: balance_address, len: 32},];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = 0; // callerAddr doesn't matter
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Checked balance at address 0x${balance_address.toString(16)}.`);
	console.log(`Balance = ${parseInt(data.returnValue.toString("hex"), 16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function transfer(caller_address, to_address, value) {
	const calldata = [{index: 0, value: 0xa9059cbb, len: 4},
					   {index: 4, value: to_address, len: 32},
					   {index: 36, value: value, len: 32}];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = caller_address;
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Gave ${value} tokens from address 0x${caller_address.toString(16)} to address 0x${to_address.toString(16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function get_allowance(token_owner, spender) {
	const calldata = [{index: 0, value: 0xdd62ed3e, len: 4},
					  {index: 4, value: token_owner, len: 32},
					  {index: 36, value: spender, len: 32}];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = 0; // callerAddr doesn't matter
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Checked allowance for address 0x${spender.toString(16)} given by address 0x${token_owner.toString(16)}.`);
	console.log(`Allowance = ${parseInt(data.returnValue.toString("hex"), 16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function approve(caller_address, spender, amount) {
	const calldata = [{index: 0, value: 0x095ea7b3, len: 4},
					  {index: 4, value: spender, len: 32},
					  {index: 36, value: amount, len: 32}];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = caller_address;
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Approved ${amount} tokens owned by address 0x${caller_address.toString(16)} for address 0x${spender.toString(16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

async function transfer_from(caller_address, token_owner, recipient, amount) {
	const calldata = [{index: 0, value: 0x23b872dd, len:4},
					  {index: 4, value: token_owner, len: 32},
					  {index: 36, value: recipient, len: 32},
					  {index: 68, value: amount, len: 32}];
	const initialMemory = [], inputStack = [], callvalue = 0;
	const callerAddr = caller_address;
	let data = await main(vm, 'ERC20__MAIN', inputStack, initialMemory, calldata, callvalue, callerAddr);
	console.log(`*** Transferred ${amount} tokens approved for 0x${caller_address.toString(16)}`,
		`from address 0x${token_owner.toString(16)} to address 0x${recipient.toString(16)}.`);
	if (showGasCost) {console.log(`Gas cost when executing macro = ${data.gas}.`);}
}

/*
Examples

init(20, 1000); // Initialises ERC20 with 1000 tokens at address 20
get_total_supply(); // Self-explanatory

get_balance_of(20); // Gets balance at address 20
transfer(20, 30, 100); // Transfers 100 tokens from 20 to 30

get_allowance(20, 40); // Gets allowance given to 40 by 20
approve(20, 40, 100); // Approves 100 of 20's tokens for 40
transfer_from(20, 40, 50); // Transfers 50 of 20's tokens approved for 40 to 40
*/

async function runMainLoop() {
	await init(0xabba, 20000);
	await get_total_supply();

	await transfer(0xabba, 0xade1e, 1000);
	await get_balance_of(0xabba);
	await get_balance_of(0xade1e);

	await approve(0xabba, 0xca5cada, 1215);
	await get_allowance(0xabba, 0xca5cada);

	await transfer_from(0xca5cada, 0xabba, 0xade1e, 800);
	await get_balance_of(0xabba);
	await get_balance_of(0xade1e);
	await get_balance_of(0xca5cada);
	await get_allowance(0xabba, 0xca5cada);

	// 0-transfers are allowed
	await transfer(0xc1e99, 0xcab1e, 0);
	await transfer_from(0xcabba9e, 0xa1fa1fa, 0xbee7, 0);
}

runMainLoop().then(() => console.log('...fin'));