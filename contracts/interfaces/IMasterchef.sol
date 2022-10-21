// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

interface IMasterchef {
  function pendingRBS(uint256 _pid, address _user) external view returns (uint256);
  function withdraw(uint256 _pid, uint256 _amount) external ;
  function deposit(uint256 _pid, uint256 _amount, address _referrer) external;
}