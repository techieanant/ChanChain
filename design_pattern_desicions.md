Design Pattern Decisions
===================

Due to the inherent nature of blockchain based contract execution, missing low level programming abstractions, and the constant evolution of platform features and security considerations, writing correct and secure smart contracts for Ethereum is a difficult task. By using common design patterns the programmer can ensure that formalized best practices in security, maintenance and ownership are being followed.

----------

My smart contract implements a simple imageboard which tracks the last 32 active threads. Some of the common design patterns I used in writing this smart contract are:

### Lock pragmas to specific compiler version
Locking the pragma helps ensure that contracts do not accidentally get deployed using, for example, the latest compiler which may have higher risks of undiscovered bugs. Contracts should be deployed with the same compiler version and flags that they have been tested the most with. I locked my contract version to 0.4.24 as 0.4.25 is still in development.

```
pragma solidity 0.4.24;
```

### Ownership
Ownership pattern is implemented using a modifier which controls access to smart-contract. The onlyOwner modifier limits access to certain functions like setting fee for posting a new thread/reply, pausing and killing the smart contract to only the owner of the contract. I implemented this pattern so that I can increase or reduce the post submission fee, pause or kill the contract at a future date.
```
 modifier onlyOwner() {
   require (msg.sender == owner);
   _;
 }
```
### Fail early and fail loud
 Require statements and modifiers are used where ever possible in lieu of if statements. I implemented this pattern to make use of Solidity modifiers and follow DRY (don't repeat yourself).

```
 modifier onlyOwner() {
   require (msg.sender == owner);
   _;
 }
```
```
modifier payFeeNewThread() {
	require(msg.value >= feeNewThread);
	_;
}
```
```
modifier payFeeReplyThread() {
	require(msg.value >= feeReplyThread);
	_;
}
```

### Circuit Breaker
The circuit breaker pattern allows the owner to disable or enable a contract by a runtime toggle. I implemented this pattern in my contract to stop submission of new threads and replies in case the imageboard is spammed with unwanted/illegal content.
```
modifier isHalted() {
	require(isPaused == false);
	_;
}
```
```
function toggleContractActive() onlyOwner public
{
    isPaused = !isPaused;
}
```

### Contract Self Destruction
This pattern is used for terminating a contract, which means removing it forever from the blockchain. Once destroyed, it’s not possible to invoke functions on the contract and no transactions will be logged in the ledger. I implemented this pattern so that if any unwanted/illegal content is posted and authorities want to take it down, I can pull the kill switch instantly.
```
function isKill() public onlyOwner{
     selfdestruct(owner);
}
```

### Mapping Iterator
Mappings in Solidity cannot be iterated and they only store values. I used this pattern as I needed to keep track of thread and reply indexes and iterate through the mapping when rendering the threads on UI.
```
mapping (uint256 => thread) public threads;
uint256 public indexThreads = 1;
```
```
mapping (uint256 => reply) public replies;
uint256 public indexReplies = 1;
```

### Withdrawal Pattern
Unless there is a self destruct / suicide function, or a way to transfer ether, there's no way to get ether out of a smart contract and this is by design. As my contract imposes a small fee to post new thread or reply to an existing thread, this design pattern was very useful to withdraw all ether collected in the contract without having to kill it.
```
function withdraw(uint256 _amount) public onlyOwner isHalted {
	owner.transfer(_amount);
}
```
