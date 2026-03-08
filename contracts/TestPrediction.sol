// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TestPrediction {
    uint256 public value;
    
    function setValue(uint256 _value) external {
        value = _value;
    }
}
