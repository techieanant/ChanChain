var ChanChain = artifacts.require("./ChanChain.sol");
var LibraryDemo = artifacts.require("./LibraryDemo.sol");
var ExampleLibrary = artifacts.require("./ExampleLibrary.sol");

module.exports = function(deployer) {
  deployer.deploy(ChanChain, 1000, 100).then(() => {
    return ChanChain.address;
  });
  deployer.deploy(ExampleLibrary).then(() => {
    deployer.deploy(LibraryDemo);
  });
  deployer.link(ExampleLibrary, LibraryDemo);
};
