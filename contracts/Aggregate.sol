// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library SharedStructs {
    struct SwapDescription {
        IERC20 srcToken;
        IERC20 dstToken;
        address[] srcReceivers;
        uint256[] srcAmounts;
        address dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
        bytes permit;
    }
}

interface ISwapMining {
    function swap(
        address account,
        address input,
        address output,
        uint256 amount
    ) external returns (bool);
}

interface IAggregationExecutor {
    function callBytes(bytes calldata data) external payable; // 0xd9c45357

    // callbytes per swap sequence
    function swapSingleSequence(bytes calldata data) external;

    function finalTransactionProcessing(
        address tokenIn,
        address tokenOut,
        address to,
        bytes calldata destTokenFeeData
    ) external;
}

interface IAggregationRouter {
    function swap(
        IAggregationExecutor caller,
        SharedStructs.SwapDescription calldata desc,
        bytes calldata data
    ) external payable returns (uint256 returnAmount);
}

contract Aggregator is Ownable {
    address public swapMining;
    address public aggregationRouter;
    address private weth;

    constructor() {
        weth = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    }

    function setSwapMining(address _swapMininng) public onlyOwner {
        swapMining = _swapMininng;
    }

    function setAggregationRouter(address _aggregationRouter) public onlyOwner {
        aggregationRouter = _aggregationRouter;
    }

    function setWeth(address _weth) public onlyOwner {
        weth = _weth;
    }

    function swap(
        IAggregationExecutor caller,
        SharedStructs.SwapDescription calldata desc,
        bytes calldata data
    ) external payable returns (uint256 returnAmount) {
        require(swapMining != address(0), "Aggregate: swapMining is not set");
        require(
            aggregationRouter != address(0),
            "Aggregate: aggregationRouter is not set"
        );
        if (address(desc.srcToken) != weth) {
            desc.srcToken.transferFrom(msg.sender, address(this), desc.amount);
        }
        returnAmount = IAggregationRouter(aggregationRouter).swap(
            caller,
            desc,
            data
        );
        ISwapMining(swapMining).swap(
            msg.sender,
            address(desc.srcToken),
            address(desc.dstToken),
            returnAmount
        );
    }
}
