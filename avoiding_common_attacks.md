Avoiding Common Attacks
===================

Ethereum and complex blockchain programs are new and highly experimental. Therefore, we should expect constant changes in the security landscape, as new bugs and security risks are discovered, and new best practices are developed. The cost of failure can be high, and change can be difficult, and that is why by following smart contract security techniques and industry best practices,  we can avoid common previously discovered attacks.

----------

My smart contract implements a simple imageboard which tracks the last 32 active threads. Most common known attacks can't be used on my contract but it does store small amounts of ether being sent to the contract as fee, which might be a target for attackers. Here are some steps I took to mitigate these common attacks:

### Race Conditions - Reentrancy
Calling external contract means it takes over control and in this case can call functions that could be called repeatedly before the first invocation of the function was finished. The contract does not make use of external calls for any functionality thus avoiding this common attack vector. Where external calls can't be avoided then internal work should be done before the call.


### Race Conditions - Cross-function
It is similar to Reentrancy where a function is called while the original call is still being executed. Both functions can be part of the same contract or they can be different contracts sharing same state. The contract does not call other functions in the contract and thus avoids this particular pitfall. In general it can be mitigated by avoiding external calls and making sure internal work is done before making another call.

### Logic bugs
Simple programming mistakes can cause the contract to behave differently to its stated rules, especially in 'edge cases'. I avoided these logic bugs by:

 - Following strict Soldity programming standards.
 - Avoiding complex rules and that guide the contract and using a complicated implementation.
 - Running unit tests to make sure the code does what it is supposed to be doing.

### Exposed Secrets
All code and data on the blockchain is visible by anyone, even if not marked as "public" in Solidity. Best way to avoid this threat is to ensure contracts do not rely on any secret information. But in case they do, one way to make data secret is to perform the encryption and decryption off-chain and then put the encrypted data on chain. This contract does not store any sensitive information, and the users should avoid posting confidential data in thread posts and replies.

### Transaction ordering
Miners choose order to include transactions from mempool in their block. Anyone can know what transaction is about to be mined by carefully examining the mempool and exploiting this knowledge. This isn't an issue for this contract but can be important to bear in mind for things like decentralised exchanges where batch submitting might be a good solution.

### Timestamp Dependence
Timestamps of blocks can be manipulated by the miner. It depends on how fine-grained we need to be when using time based functions. The timestamp has to have a later time than the previous block's timestamp, and if it's too inaccurate then other miners will reject it. So if our contract has to count days, and two years from now it will still be running and counting days, then timestamps are probably the way to go. We'll have to think carefully about what happens if a miner shifts the time by a few seconds. If our contract is just going to run for a short time, then this problem can be mitigated by using block numbers and not worry about manipulation at all. This contract does make use of timestamps using Solidity "now" keyword but the timestamp is not used for any critical function and a couple of seconds off from the real time won't make a difference.

### Forcibly Sending Ether to a Contract
Typically when ether is sent to a contract, it must execute either the fallback function, or another function described in the contract. There are two exceptions to this, where ether can exist in a contract without having executed any code. Contracts which rely on code execution for every ether sent to the contract can be vulnerable to attacks where ether is forcibly sent to a contract. This project doesn't use contract balance in critical logic any ether sent to it can be withdrawn by the owner (thanks for the donation).

### DoS with Block Gas Limit
Block gas limits are the maximum amount of gas allowed in a block to determine how many transactions can fit into a block. An infinite loop will quickly hit the block gas limit and then halt with an out of gas exception. This contract loops through replies to find the most recent thread with a reply, but it only runs 32 times as the condition is baked into the loop. This attack can be easily avoided by not looping over an array of unknown size.
