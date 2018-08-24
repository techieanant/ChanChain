pragma solidity 0.4.24;

import "./ExampleLibrary.sol";

contract LibraryDemo {
    function thatAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return ExampleLibrary.add(a, b);
    }

    function thisAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
}
