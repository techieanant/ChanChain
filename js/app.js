App = {
  web3Provider: null,
  ipfsProvider: 'ipfs.infura.io',
  ipfs: null,
  contracts: {},
  account: 0x0,
  lastActiveThreads: [],
  loading: false,

  init: function() {
    App.nsfwToggle();
    return App.initWeb3();
  },

  initIPFS: function() {
    App.ipfs = window.IpfsApi(App.ipfsProvider, '5001', {protocol: 'https'});
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
      App.getLastActiveThreads();

      // console.log(artifact);
      // Retrieve the article from the smart contract
      // return App.reloadArticles();
    });
  },

  getLastActiveThreads: function(){
    App.contracts.ChanChain.deployed().then(instance => {
      instance.indexLastThreads.call().then(id => {
        var indexLastThreads = id.toNumber();
        for(var i = 0; i < 32; i++) {
          instance.lastThreads.call(i).then(response => {
            var threadId = response.toNumber();
            if(threadId != 0) {
              instance.threads(threadId).then(response => {
                App.pushToThreads(App.createThreadObject(threadId,response[0],response[1],response[4]));
              });
            }
          });
          indexLastThreads = (indexLastThreads + 1) % 32;
        }
      }).then(() => {
        instance.indexReplies.call().then(response => {
          var replyIndex = [];
          for(var i = 1; i < response.toNumber(); i++) {
            replyIndex.push(i);
          }
          $.each(replyIndex, function( index, value ) {
            instance.replies(value).then(response => {
            App.pushToReplies(response[2], App.createReplyObject(value, response[2], response[0], response[1], response[4]));
            });
          });
        });
      }).then(() => {
        App.listenToEvents();
      });
    });
  },

  nsfwToggle: function() {
    if($("#nsfwToggle")[0].checked) {
      $("img").css({
       WebkitFilter: 'blur(0px)'
     });
    } else {
      $("img").css({
       WebkitFilter: 'blur(20px)'
     });
    }
  },

  postNewThread: function() {
    var modalSubmit = $("#modalSubmit");
    var imageUpload = $("#imageUpload");
    var messageText = $("#messageText");
    var previewContainer = $("#previewContainer");
    imageUpload.on("change",function(){
      $.LoadingOverlay("show");
      const reader = new FileReader();
      reader.readAsArrayBuffer(imageUpload[0].files[0]);
      reader.onloadend = function() {
          const buf = buffer.Buffer(reader.result)
          App.ipfs.files.add(buf, (err, result) => {
            previewContainer.attr("src", "https://" + App.ipfsProvider + "/ipfs/" + result[0].hash);
            $.LoadingOverlay("hide");
            modalSubmit.click(function(){
                App.createThread(messageText, result[0].hash);
            });
          });
        }
    });
  },

  createThread: function(text, ipfshash) {
    App.contracts.ChanChain.deployed().then(function(instance){
      instance.createThread(text.val(), ipfshash, {value: 1000, from: App.account}).then(res => {
        $('#Modal').modal('hide');
      });
    });
  },

  pushToThreads: function(threadObj) {
    for(var i = 0; i < App.lastActiveThreads.length; i++)
        if(App.lastActiveThreads[i].threadId == threadObj.threadId) return;
    App.lastActiveThreads.push(threadObj);
    if(App.lastActiveThreads.length > 32)
      App.lastActiveThreads.shift();
  },

  pushToReplies: function(threadId, replyObj) {
    for(var i = 0; i < App.lastActiveThreads.length; i++) {
      if(App.lastActiveThreads[i].threadId == replyObj.threadId.toNumber()) {
        for(var j = 0; j < App.lastActiveThreads[i].replies.length; j++) {
          if(App.lastActiveThreads[i].replies[j].replyId == replyObj.reply.replyId) {
            return;
          }
        }
        App.lastActiveThreads[i].replies.push(replyObj.reply);
      }
    }
  },

  createThreadObject: function(id, text, ipfshash, timestamp) {
    return {
      threadId: id,
      text: text,
      ipfshash: ipfshash,
      timestamp: timestamp,
      replies: []
    }
  },

  createReplyObject: function(replyId, replyTo, text, ipfshash, timestamp) {
    return {
      threadId: replyTo,
      reply: {
        replyId: replyId,
        text: text,
        ipfshash: ipfshash,
        timestamp: timestamp
      }
    }
  },

  reloadAll: function(){
    $('#contentRow').empty();
    $.each(App.lastActiveThreads, function(key, thread){
      App.displayThreadCards(thread.text, thread.ipfshash, thread.timestamp.toNumber(), thread.threadId);
    });
  },

  displayThreadCards: function(text, ipfshash, timestamp, threadId) {
    if(ipfshash == "") {
      ipfshash = "QmdrA4mUBg6bKnhhkTXBkbpEfEeqwTZLdBwi11Hx9Q5VhF";
    }
    var imgsrc = "https://" + App.ipfsProvider + "/ipfs/" + ipfshash;
    var contentRow = $('#contentRow');
    var cardTemplate = $('#cardTemplate');
    if($.trim(text).substring(0, 150).split(" ").length > 1 && $.trim(text).substring(0, 150).split(" ").length > 150){
        var shortText = $.trim(text).substring(0, 150).split(" ").slice(0, -1).join(" ") + " .....";
    }  else {
      var shortText = $.trim(text);
    }
    var datePosted = new Date(timestamp * 1000);
    cardTemplate.find('.card-text').text(shortText);
    cardTemplate.find('.card-img-top').attr('src', imgsrc);
    cardTemplate.find('.card-header').text(datePosted.toLocaleString());
    cardTemplate.find('.card').attr('id', threadId);
    cardTemplate.find('.card').removeClass('d-none');
    cardTemplate.find('.card').attr('onclick', 'App.displayThreadPage(' + threadId + ')');
    contentRow.append(cardTemplate.html());
  },

  displayThreadPage: function(threadId) {
    $.each(App.lastActiveThreads, function(key, thread){
      if(App.lastActiveThreads[key].threadId == threadId) {
        var threadTemplate = App.createThreadPage(thread.text, thread.ipfshash, thread.timestamp, thread.threadId);
        var contentRow = $('#contentRow');
        contentRow.find('.card').remove();
        contentRow.append(threadTemplate);
        $('#backToHome').removeClass('d-none');
        if(thread.replies.length > 0) {
          $.each(thread.replies, function(key, reply){
            var replyTemplate = App.createThreadPage(reply.text, reply.ipfshash, reply.timestamp, reply.replyId);
            contentRow.append(replyTemplate);
          });
        }
      }
    });
  },

  createThreadPage: function(text, ipfshash, timestamp, threadId) {
    if(ipfshash == "") {
      ipfshash = "QmdrA4mUBg6bKnhhkTXBkbpEfEeqwTZLdBwi11Hx9Q5VhF";
    }
    var ipfsURL = "https://" + App.ipfsProvider + "/ipfs/" + ipfshash;
    var threadTemplate = $('#threadTemplate');
    var datePosted = new Date(timestamp.toNumber() * 1000);
    threadTemplate.find('#threadPostImg').attr('src', ipfsURL);
    threadTemplate.find('#threadPostText').text(text);
    threadTemplate.find('#threadPostTimestamp').text(datePosted.toLocaleString());
    threadTemplate.find('.threadPost').attr('id', threadId);
    threadTemplate.find('.threadPost').removeClass('d-none');
    return threadTemplate.html();
  },

  listenToEvents: function() {
    App.contracts.ChanChain.deployed().then(function(instance) {
      instance.newThreadEvent().watch(function(error, event) {
        console.log("NewThreadEvent received: " + event);
        App.pushToThreads(App.createThreadObject(event.args.threadId.toNumber(),event.args.text,event.args.ipfsHash,event.args.timestamp));
        App.reloadAll();
      });

      instance.newReplyEvent().watch(function(error, event) {
        console.log("newReplyEvent received: " + event);
        App.pushToReplies(event.args.replyTo.toNumber(), App.createReplyObject(event.args.replyId.toNumber(), event.args.replyTo, event.args.text, event.args.ipfsHash, event.args.timestamp));
        App.reloadAll();
      });
    });
  },

};

$(function() {
  $(window).ready(function() {
    App.init();
    $("#nsfwToggle").on('change', function(){
        App.nsfwToggle();
    });
  });
});
