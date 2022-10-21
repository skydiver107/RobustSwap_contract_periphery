pragma solidity =0.6.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MockTokenERC20 is ERC20 {
    // uint256 private constant SUPPLY = 100_000_000e18;
    constructor(string memory name, string memory symbol, uint8 decimals, uint256 totalsupply) public ERC20(name, symbol){
        _setupDecimals(decimals);
        _mint(msg.sender, totalsupply);
    }
}
