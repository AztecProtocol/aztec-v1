pragma solidity >=0.5.0 <0.6.0;


/**
 * @title IERC20Permit
 * @dev Interface for ERC20 with minting function
 * Sourced from OpenZeppelin 
 * (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/IERC20.sol) 
 * and with an added permit() and mint() function. 
 */
contract IERC20Permit {

    mapping (address => uint)                      public nonces;
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);
    
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;   

    function mint(address _to, uint256 _value) external returns (bool);   

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}
