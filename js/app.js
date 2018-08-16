App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
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
      console.log(App.contracts.ChanChain.abi);
      // Retrieve the article from the smart contract
      // return App.reloadArticles();
    });
  },

  fetchAllThreads: function(){
    App.contracts.ChanChain.deployed().then(instance => {
      instance.indexThreads.call().then(index => {
        for(i=1; i <= index.toNumber() - 1; i++) {
            instance.threads(i).then(data => {
              App.displayThreadCards(data[0], data[1], data[4].toNumber());
            });
        }
      });
    });
  },

  displayThreadCards: function(text, imgsrc, timestamp) {
    var cardsRow = $('#cardsRow');
    var cardTemplate = $('#cardTemplate');
    var shortText = jQuery.trim(text).substring(0, 30).split(" ").slice(0, -1).join(" ") + "...";
    cardTemplate.find('.card-text').text(shortText);
    cardTemplate.find('.card-img-top').attr('src', imgsrc);
    cardTemplate.find('.card-header').text(timestamp);
    cardTemplate.find('.card').removeClass('d-none');
    cardsRow.append(cardTemplate.html());
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
