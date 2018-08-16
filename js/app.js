App = {
  web3Provider: null,
  ipfsProvider: 'ipfs.infura.io',
  ipfs: null,
  contracts: {},
  account: 0x0,
  currentThread: [],
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initIPFS: function() {
    App.ipfs = window.IpfsApi(App.ipfsProvider, '5001');
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
      web3 = new Web3(App.web3Provider);
    }

    if(web3.eth.accounts.length > 0) {
      $("#alertRow").addClass("d-none");
    } else {
      $("#alertRow").removeClass("d-none");
    }

    App.displayAccountInfo();
    App.initIPFS();
    return App.initContract();
  },

  displayAccountInfo: function() {
  if(web3.eth.accounts.length > 0) {
    App.account = web3.eth.coinbase;
    $("#wallet-address").text(App.account);
    web3.eth.getBalance(App.account, function(err, balance) {
      if (err === null) {
        $("#wallet-balance").text(web3.fromWei(balance, "ether").toFixed(2));
      }
    });
  } else {
    $("#wallet-address").text("Null");
    $("#wallet-balance").text("Null");
  }

  },

  initContract: function() {
    $.getJSON('./build/contracts/ChanChain.json', function(artifact) {
      // Get the necessary contract artifact file and use it to instantiate a truffle contract abstraction.
      App.contracts.ChanChain = TruffleContract(artifact);

      // Set the provider for our contract.
      App.contracts.ChanChain.setProvider(App.web3Provider);

      // Listen for events
      // App.listenToEvents();
      App.fetchAllThreads();

      // console.log(artifact);
      // Retrieve the article from the smart contract
      // return App.reloadArticles();
    });
  },

  fetchAllThreads: function(){
    App.contracts.ChanChain.deployed().then(instance => {
      instance.indexThreads.call().then(index => {
        for(var i = 1; i < index.toNumber(); i++) {
          App.currentThread.push(i);
            instance.threads(i).then(data => {
              var ipfsURL = "https://" + App.ipfsProvider + "/ipfs/" + data[1];
              App.displayThreadCards(data[0], ipfsURL, data[4].toNumber());
            });
        }
      });
    });
  },

  displayThreadCards: function(text, imgsrc, timestamp) {
    var contentRow = $('#contentRow');
    var cardTemplate = $('#cardTemplate');
    var shortText = $.trim(text).substring(0, 150).split(" ").slice(0, -1).join(" ") + " .....";
    var datePosted = new Date(timestamp * 1000);
    var id = contentRow.find('.card').length + 1;
    cardTemplate.find('.card-text').text(shortText);
    cardTemplate.find('.card-img-top').attr('src', imgsrc);
    cardTemplate.find('.card-header').text(datePosted.toLocaleString());
    cardTemplate.find('.card').attr('id', id);
    cardTemplate.find('.card').removeClass('d-none');
    cardTemplate.find('.card').attr('onclick', 'App.displayThreadPage(' + id + ')');
    contentRow.append(cardTemplate.html());
  },

  displayThreadPage: function(index) {
    console.log(index);
  },

  // Listen for events raised from the contract
  listenToEvents: function() {
    App.contracts.ChanChain.deployed().then(function(instance) {
      instance.sellArticleEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        $("#events").append('<li class="list-group-item">' + event.args
          ._name + ' is for sale' + '</li>');
        App.reloadArticles();
      });

      instance.buyArticleEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        $("#events").append('<li class="list-group-item">' + event.args
          ._buyer + ' bought ' + event.args._name + '</li>');
        App.reloadArticles();
      });
    });
  },

};

$(function() {
  $(window).ready(function() {
    App.init();
  });
});
