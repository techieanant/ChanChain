/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */

 var HDWalletProvider = require("truffle-hdwallet-provider");
 var mnemonic = "volume praise begin genuine feel cousin update script essence expire elite desk";

 module.exports = {
   networks: {
     development: {
       host: "localhost",
       port: 9545,
       network_id: "*" // Match any network id
     },
     mainnet: {
        network_id: 1,
        port: 8546,
        host: "localhost",
        gasPrice: 10000000000,
        gas: 700000
    },
    ropsten: {
      network_id: 3,
      host: "localhost",
      port:  8545,
      gas:   2900000,
      provider: function() {
        return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/eb41d8eca36649e1a68a61e3f233e55c')
      },
    }
   }
 };
