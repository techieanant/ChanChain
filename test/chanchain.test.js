var ChanChain = artifacts.require("./ChanChain.sol");

contract('ChanChain', function(accounts){

const owner = accounts[0];
const account1 = accounts[1];
const feeNewThread = 1000;
const feereplyThread = 100;

var contract;

beforeEach(function() {
   return ChanChain.new(feeNewThread, feereplyThread, {from: owner})
   .then(function(instance) {
      contract = instance;
   });
});

it("constructor(): Deploys the contract and sets feeNewThread and feeReplyThread", async () => {
  const expectedfeeNewThread = 1000;
  const expectedfeereplyThread = 100;
  contract.feeNewThread.call()
    .then(data => {assert.equal(data.toNumber(), expectedfeeNewThread, 'Fee for posting new thread should be 1000 wei');});
  contract.feeReplyThread.call()
  .then(data => {assert.equal(data.toNumber(), expectedfeereplyThread, 'Fee for posting a reply should be 100 wei');});
});

it("function toggleContractActive(): Owner can toggle the state of contract to paused or vice versa", async () => {
  const initialIndexThreads = await contract.indexThreads.call();
  await contract.createThread( "Some Text", web3.fromAscii("1234567890"), {value: 1000 ,from: owner});
  let newIndexThreads = await contract.indexThreads.call();
  assert.equal(newIndexThreads, initialIndexThreads.toNumber() + 1, 'New thread should be created if the contract is not paused');
  await contract.toggleContractActive({from: owner});
  await contract.createThread( "Some More Text", web3.fromAscii("1234567890"), {value: 1000 ,from: owner})
    .catch(error => {
      assert.equal(newIndexThreads.toNumber(), 2, 'Creating new thread when contract is paused should revert');
    });
  await contract.toggleContractActive({from: owner});
  await contract.createThread( "Some More More Text", web3.fromAscii("1234567890"), {value: 1000 ,from: account1})
    .then(data => {
      assert.equal(newIndexThreads.toNumber() + 1, 3, 'Should be able to create new thread if contract is unpaused');
    })
});

it("function setFees(): Resets fee for submitting a new thread and replying to a thread if called by owner", async () => {
  const updatedFeeNewThread = 10000;
  const updatedFeereplyThread = 1000;
  contract.setFees(10000, 1000, {from: owner})
    .then(() => {
      contract.feeNewThread.call()
        .then(data => {assert.equal(data.toNumber(), updatedFeeNewThread, 'Fee for posting a reply should be 10000 wei');});
      contract.feeReplyThread.call()
        .then(data => {assert.equal(data.toNumber(), updatedFeereplyThread, 'Fee for posting a reply should be 1000 wei');});
      });
});

it("function withdraw(): Transfers the ether in contract to owner", async () => {
  const transferAmount = web3.toWei(1, "ether");
  let ownerOriginalBalance = web3.eth.getBalance(owner).toNumber();
  let ownerNewBalance = null;
  await contract.createThread("Some Text", "0x1234567890", {value: transferAmount,from: account1});
  assert.equal(web3.eth.getBalance(contract.address).toNumber(), transferAmount, 'Ether sent with the createThread transaction should be available in the contract');
  await contract.withdraw(transferAmount, {from: account1}).then(()=> {ownerNewBalance = web3.eth.getBalance(owner).toNumber();});
  assert.equal(web3.eth.getBalance(contract.address).toNumber(), 0, 'The amount in contract should be 0');
  assert.equal(ownerNewBalance, +ownerOriginalBalance + +transferAmount, 'The amount in contract should get transferred to the owner');
});

it("function createThread(): Creates a new thread if fees is paid", async () => {
  const initialIndexThreads = await contract.indexThreads.call();
  await contract.createThread("Some Text", web3.fromAscii("1234567890"), {value: 1000,from: account1})
    .then(data => {
      assert.equal(data.logs[0].event, "newThreadEvent", 'The newThreadEvent should be fired when a new thread is created');
    });
    let newIndexThreads = await contract.indexThreads.call();
    assert.equal(newIndexThreads.toNumber(), initialIndexThreads.toNumber() + 1, 'The index of threads:indexThreads should be increased by 1');
    let newThread = await contract.threads(initialIndexThreads);
    assert.equal(newThread[0], "Some Text", 'The newly created thread should have the text supplied');
    assert.equal(web3.toAscii(newThread[1]).replace(/\u0000/g, ''), "1234567890", 'The thread ipfs should match');
});

it("function replyThread(): Replies to a thread if the fees is paid and thread exists", async () => {
  const initialIndexReplies = await contract.indexReplies.call();
  await contract.createThread( "Some Text", web3.fromAscii("1234567890"), {value: 1000 ,from: account1});
  await contract.replyThread( 1, "Some Reply Text", web3.fromAscii("1234512345"), {value: 100 ,from: account1})
    .then(data => {
      assert.equal(data.logs[0].event, "newReplyEvent", 'The newThreadEvent should be fired when a new thread is created');
    });
    let newReply = await contract.replies(initialIndexReplies);
    let newIndexReplies = await contract.indexReplies.call();
    assert.equal(newIndexReplies.toNumber(), initialIndexReplies.toNumber() + 1, 'The index of replies:indexReplies should be increased by 1');
    assert.equal(newReply[0], "Some Reply Text", 'The reply text should match');
    assert.equal(web3.toAscii(newReply[1]).replace(/\u0000/g, ''), "1234512345", 'The reply ipfs should match');
    assert.equal(newReply[2].toNumber(), 1, 'The thread index this reply is associated with should match');
});

});
