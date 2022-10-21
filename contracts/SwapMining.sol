// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./libraries/SafeMath.sol";
import "./libraries/RobustswapLibrary.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IRobustswapFactory.sol";
// import "./interfaces/IRobustswapPair.sol";
import "./interfaces/IRobustswapERC20.sol";
// import "hardhat/console.sol";
import "./interfaces/IMasterchef.sol";

interface IOracle {
    function update(address tokenA, address tokenB) external;

    function consult(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external view returns (uint256 amountOut);
}

contract SwapMining is Ownable {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private _whitelist;

    // RBS tokens created per block
    uint256 public babyPerBlock;
    // The block number when RBS mining starts.
    uint256 public startBlock;
    // How many blocks are halved
    uint256 public halvingPeriod = 5256000;
    // Total allocation points
    uint256 public totalAllocPoint = 0;
    IOracle public oracle;
    // router address
    address public router;
    // masterchef address
    address public masterchef;
    // factory address
    IRobustswapFactory public factory;
    // rbstoken address
    IRobustswapERC20 public robustToken;
    // Calculate price based on BUSD
    address public targetToken;
    // pair corresponding pid
    mapping(address => uint256) public pairOfPid;
    // pid of SwapMiningPool in the MasterChef
    uint256 public miningPID;

    constructor(
        address _robustToken,
        address _factory,
        address _oracle,
        address _router,
        address _targetToken,
        uint256 _startBlock
    ) public {
        // console.log("_robusttoken = ", _robustToken);
        require(_robustToken != address(0), "illegal address");
        robustToken = IRobustswapERC20(_robustToken);
        require(_factory != address(0), "illegal address");
        factory = IRobustswapFactory(_factory);
        require(_oracle != address(0), "illegal address");
        oracle = IOracle(_oracle);
        require(_router != address(0), "illegal address");
        router = _router;
        targetToken = _targetToken;
        startBlock = _startBlock;
    }

    struct UserInfo {
        uint256 quantity; // How many LP tokens the user has provided
        uint256 blockNumber; // Last transaction block
    }

    struct PoolInfo {
        address pair; // Trading pairs that can be mined
        uint256 quantity; // Current amount of LPs
        uint256 totalQuantity; // All quantity
        uint256 allocPoint; // How many allocation points assigned to this pool
        uint256 allocRBSAmount; // How many RBSs
        uint256 lastRewardBlock; // Last transaction block
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    function poolLength() public view returns (uint256) {
        return poolInfo.length;
    }

    function addPair(
        uint256 _allocPoint,
        address _pair,
        bool _withUpdate
    ) public onlyOwner {
        require(_pair != address(0), "_pair is the zero address");
        if (_withUpdate) {
            massMintPools();
        }
        uint256 lastRewardBlock = block.number > startBlock
            ? block.number
            : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                pair: _pair,
                quantity: 0,
                totalQuantity: 0,
                allocPoint: _allocPoint,
                allocRBSAmount: 0,
                lastRewardBlock: lastRewardBlock
            })
        );
        pairOfPid[_pair] = poolLength() - 1;
    }

    // Update the allocPoint of the pool
    function setPair(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        require(_pid < poolLength(), "SwapMining: Pool not found");
        if (_withUpdate) {
            massMintPools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // Only tokens in the whitelist can be mined RBS
    function addWhitelist(address _addToken) public onlyOwner returns (bool) {
        require(
            _addToken != address(0),
            "SwapMining: token is the zero address"
        );
        return EnumerableSet.add(_whitelist, _addToken);
    }

    function delWhitelist(address _delToken) public onlyOwner returns (bool) {
        require(
            _delToken != address(0),
            "SwapMining: token is the zero address"
        );
        return EnumerableSet.remove(_whitelist, _delToken);
    }

    function getWhitelistLength() public view returns (uint256) {
        return EnumerableSet.length(_whitelist);
    }

    function isWhitelist(address _token) public view returns (bool) {
        return EnumerableSet.contains(_whitelist, _token);
    }

    function getWhitelist(uint256 _index) public view returns (address) {
        require(
            _index <= getWhitelistLength() - 1,
            "SwapMining: index out of bounds"
        );
        return EnumerableSet.at(_whitelist, _index);
    }

    // function setHalvingPeriod(uint256 _block) public onlyOwner {
    //     halvingPeriod = _block;
    // }

    function setRouter(address newRouter) public onlyOwner {
        require(
            newRouter != address(0),
            "SwapMining: new router is the zero address"
        );
        router = newRouter;
    }

    function setMasterChef(address newMasterchef) public onlyOwner {
        require(
            newMasterchef != address(0),
            "SwapMining: new masterchef is the zero address"
        );
        masterchef = newMasterchef;
    }

    function setOracle(IOracle _oracle) public onlyOwner {
        require(
            address(_oracle) != address(0),
            "SwapMining: new oracle is the zero address"
        );
        oracle = _oracle;
    }

    // At what phase
    // function phase(uint256 blockNumber) public view returns (uint256) {
    //     if (halvingPeriod == 0) {
    //         return 0;
    //     }
    //     if (blockNumber > startBlock) {
    //         return (blockNumber.sub(startBlock).sub(1)).div(halvingPeriod);
    //     }
    //     return 0;
    // }

    // function phase() public view returns (uint256) {
    //     return phase(block.number);
    // }

    // function reward(uint256 blockNumber) public view returns (uint256) {
    //     uint256 _phase = phase(blockNumber);
    //     return babyPerBlock.div(2 ** _phase);
    // }

    // function reward() public view returns (uint256) {
    //     return reward(block.number);
    // }

    // Rewards for the current block
    function getRbsReward() public view returns (uint256) {
        return IMasterchef(masterchef).pendingRBS(miningPID, address(this));
    }

    // mock function for testing
    // user calls this function to add lp token to masterchef
    function mockDeposite(uint256 pid) public {
        IMasterchef(masterchef).deposit(pid, 1000000000000000000, address(0));
    }

    // approve the swapmining to transfer 1 lp token to masterchef
    function mockDepositeApprove(address lptoken) public {
        IERC20(lptoken).approve(masterchef, 1000000000000000000);
    }

    // function claim() public {
    //     IMasterchef(masterchef).withdraw(0, 0);
    // }

    // Update all pools Called when updating allocPoint and setting new blocks
    function massMintPools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            mint(pid);
        }
        IMasterchef(masterchef).withdraw(miningPID, 0);
    }

    function mint(uint256 _pid) public returns (bool) {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return false;
        }
        uint256 blockReward = getRbsReward();
        if (blockReward <= 0) {
            return false;
        }
        // Calculate the rewards obtained by the pool based on the allocPoint
        uint256 rbsReward = blockReward.mul(pool.allocPoint).div(
            totalAllocPoint
        );
        // Increase the number of tokens in the current pool
        pool.allocRBSAmount = pool.allocRBSAmount.add(rbsReward);
        pool.lastRewardBlock = block.number;
        return true;
    }

    modifier onlyRouter() {
        require(msg.sender == router, "SwapMining: caller is not the router");
        _;
    }

    // swapMining only router
    function swap(
        address account,
        address input,
        address output,
        uint256 amount
    )
        public
        returns (
            // onlyRouter
            bool
        )
    {
        require(
            account != address(0),
            "SwapMining: taker swap account is the zero address"
        );
        require(
            input != address(0),
            "SwapMining: taker swap input is the zero address"
        );
        require(
            output != address(0),
            "SwapMining: taker swap output is the zero address"
        );

        if (poolLength() <= 0) {
            return false;
        }

        if (!isWhitelist(input) || !isWhitelist(output)) {
            return false;
        }

        address pair = RobustswapLibrary.pairFor(
            address(factory),
            input,
            output
        );
        // address pair = output;
        PoolInfo storage pool = poolInfo[pairOfPid[pair]];
        // If it does not exist or the allocPoint is 0 then return
        if (pool.pair != pair || pool.allocPoint <= 0) {
            return false;
        }

        uint256 quantity = getQuantity(output, amount, targetToken);
        // console.log("swap quantity = ", quantity);

        if (quantity <= 0) {
            return false;
        }

        // mint(pairOfPid[pair]);
        massMintPools();

        IOracle(oracle).update(input, output);

        pool.quantity = pool.quantity.add(quantity);
        pool.totalQuantity = pool.totalQuantity.add(quantity);
        UserInfo storage user = userInfo[pairOfPid[pair]][account];
        user.quantity = user.quantity.add(quantity);
        user.blockNumber = block.number;
        return true;
    }

    function getQuantity(
        address outputToken,
        uint256 outputAmount,
        address anchorToken
    ) public view returns (uint256) {
        uint256 quantity = 0;
        if (outputToken == anchorToken) {
            quantity = outputAmount;
        } else if (
            IRobustswapFactory(factory).getPair(outputToken, anchorToken) !=
            address(0)
        ) {
            quantity = IOracle(oracle).consult(
                outputToken,
                outputAmount,
                anchorToken
            );
        } else {
            uint256 length = getWhitelistLength();
            for (uint256 index = 0; index < length; index++) {
                address intermediate = getWhitelist(index);
                if (
                    factory.getPair(outputToken, intermediate) != address(0) &&
                    factory.getPair(intermediate, anchorToken) != address(0)
                ) {
                    uint256 interQuantity = IOracle(oracle).consult(
                        outputToken,
                        outputAmount,
                        intermediate
                    );
                    quantity = IOracle(oracle).consult(
                        intermediate,
                        interQuantity,
                        anchorToken
                    );
                    break;
                }
            }
        }
        return quantity;
    }

    // The user withdraws all the transaction rewards of the pool
    function takerWithdraw() public {
        uint256 userSub;
        uint256 length = poolInfo.length;
        // IMasterchef(masterchef).withdraw(miningPID, 0);
        massMintPools();
        for (uint256 pid = 0; pid < length; ++pid) {
            PoolInfo storage pool = poolInfo[pid];
            UserInfo storage user = userInfo[pid][msg.sender];
            if (user.quantity > 0) {
                // mint(pid);
                // The reward held by the user in this pool
                uint256 userReward = pool.allocRBSAmount.mul(user.quantity).div(
                    pool.quantity
                );
                pool.quantity = pool.quantity.sub(user.quantity);
                pool.allocRBSAmount = pool.allocRBSAmount.sub(userReward);
                user.quantity = 0;
                user.blockNumber = block.number;
                userSub = userSub.add(userReward);
            }
        }
        if (userSub <= 0) {
            return;
        }
        // console.log(userSub);
        robustToken.transfer(msg.sender, userSub);
    }

    // Get rewards from users in the current pool
    function getUserReward(uint256 _pid, address _user)
        public
        view
        returns (uint256, uint256)
    {
        require(_pid <= poolInfo.length - 1, "SwapMining: Not find this pool");
        uint256 userSub;
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo memory user = userInfo[_pid][_user];
        if (user.quantity > 0) {
            uint256 blockReward = getRbsReward();
            uint256 rbsReward = blockReward.mul(pool.allocPoint).div(
                totalAllocPoint
            );
            userSub = userSub.add(
                (pool.allocRBSAmount.add(rbsReward)).mul(user.quantity).div(
                    pool.quantity
                )
            );
        }
        //Mdx available to users, User transaction amount
        return (userSub, user.quantity);
    }

    // Get rewards from users in the current pool
    function getReward(address _user) public view returns (uint256, uint256) {
        // require(_pid <= poolInfo.length - 1, "SwapMining: Not find this pool");
        uint256 length = poolInfo.length;
        uint256 userSub;
        PoolInfo memory pool;
        UserInfo memory user;
        uint256 rbsReward;
        uint256 blockReward;
        for (uint256 pid = 0; pid < length; ++pid) {
            pool = poolInfo[pid];
            user = userInfo[pid][_user];
            if (user.quantity > 0) {
                blockReward = getRbsReward();
                rbsReward = blockReward.mul(pool.allocPoint).div(
                    totalAllocPoint
                );
                userSub = userSub.add(
                    (pool.allocRBSAmount.add(rbsReward)).mul(user.quantity).div(
                        pool.quantity
                    )
                );
            }
        }
        //Mdx available to users, User transaction amount
        return (userSub, user.quantity);
    }

    // Get details of the pool
    function getPoolInfo(uint256 _pid)
        public
        view
        returns (
            address,
            address,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        require(_pid <= poolInfo.length - 1, "SwapMining: Not find this pool");
        PoolInfo memory pool = poolInfo[_pid];
        address token0 = IRobustswapPair(pool.pair).token0();
        address token1 = IRobustswapPair(pool.pair).token1();
        uint256 rbsAmount = pool.allocRBSAmount;
        uint256 blockReward = getRbsReward();
        uint256 rbsReward = blockReward.mul(pool.allocPoint).div(
            totalAllocPoint
        );
        rbsAmount = rbsAmount.add(rbsReward);
        //token0,token1,Pool remaining reward,Total /Current transaction volume of the pool
        return (
            token0,
            token1,
            rbsAmount,
            pool.totalQuantity,
            pool.quantity,
            pool.allocPoint
        );
    }

    function ownerWithdraw(address _to, uint256 _amount) public onlyOwner {
        safeRBSTransfer(_to, _amount);
    }

    function safeRBSTransfer(address _to, uint256 _amount) internal {
        uint256 balance = robustToken.balanceOf(address(this));
        if (_amount > balance) {
            _amount = balance;
        }
        robustToken.transfer(_to, _amount);
    }

    function setMiningPID(uint256 pid) external onlyOwner {
        // console.log("setminingpid", pid);
        miningPID = pid;
    }
}
