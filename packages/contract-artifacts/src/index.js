const path = require('path');

const ACE = require(path.join(__dirname, '..', 'artifacts', 'ACE.json'));
const AZTEC = require(path.join(__dirname, '..', 'artifacts', 'AZTEC.json'));
const AZTECERC20Bridge = require(path.join(__dirname, '..', 'artifacts', 'AZTECERC20Bridge.json'));
const AZTECInterface = require(path.join(__dirname, '..', 'artifacts', 'AZTECInterface.json'));
const AZTECJoinSplit = require(path.join(__dirname, '..', 'artifacts', 'AZTECJoinSplit.json'));
const AZTECJoinSplitInterface = require(path.join(__dirname, '..', 'artifacts', 'AZTECJoinSplitInterface.json'));
const Doorbell = require(path.join(__dirname, '..', 'artifacts', 'Doorbell.json'));
const ERC20 = require(path.join(__dirname, '..', 'artifacts', 'ERC20.json'));
const ERC20Interface = require(path.join(__dirname, '..', 'artifacts', 'ERC20Interface.json'));
const ERC20Mintable = require(path.join(__dirname, '..', 'artifacts', 'ERC20Mintable.json'));
const Extractor = require(path.join(__dirname, '..', 'artifacts', 'Extractor.json'));
const IERC20 = require(path.join(__dirname, '..', 'artifacts', 'IERC20.json'));
const JoinSplitABIEncoder = require(path.join(__dirname, '..', 'artifacts', 'JoinSplitABIEncoder.json'));
const NoteUtilities = require(path.join(__dirname, '..', 'artifacts', 'NoteUtilities.json'));
const Validator = require(path.join(__dirname, '..', 'artifacts', 'Validator.json'));

module.exports = {
    ACE,
    AZTEC,
    AZTECERC20Bridge,
    AZTECInterface,
    AZTECJoinSplit,
    AZTECJoinSplitInterface,
    Doorbell,
    ERC20,
    ERC20Interface,
    ERC20Mintable,
    Extractor,
    IERC20,
    JoinSplitABIEncoder,
    NoteUtilities,
    Validator,
};
