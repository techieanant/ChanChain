var ChanChain = artifacts.require("./ChanChain.sol");

module.exports = function(deployer) {
  deployer.deploy(ChanChain, 1000, 100).then(() => {
    return ChanChain.address;
  });
};
