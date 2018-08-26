App = {
  web3Provider: null,
  ipfsProvider: 'ipfs.infura.io',
  ipfs: null,
  contracts: {},
  account: 0x0,
  lastActiveThreads: [],
  loading: false,
  modalSubmit: $("#modalSubmit"),
  imageUpload:  $("#imageUpload"),
  messageText: $("#messageText"),
  previewContainer: $("#previewContainer"),
  lastEventRecorded: [],
  contractInstance: null,

  init: function() {
    App.nsfwToggle();
    return App.initWeb3();
  },

  initIPFS: function() {
    App.ipfs = window.IpfsApi(App.ipfsProvider, '5001', {protocol: 'https'});
  },

  initWeb3: async function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
    }

    web3 = new Web3(App.web3Provider);

    if(web3.eth.accounts.length > 0) {
      $("#alertRow").addClass("d-none");
    } else {
      App.notifyUser("Please install or unlock Metamask to interact with this application and reload the page.");
      $("#createThread").addClass("d-none");
      $("#postReply").addClass("d-none");
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

  initContract: async function() {
    await $.getJSON('./build/contracts/ChanChain.json', function(artifact) {
      App.contracts.ChanChain = TruffleContract(artifact);
      App.contracts.ChanChain.setProvider(App.web3Provider);
    });
    App.contractInstance = await App.contracts.ChanChain.deployed();
    try {
      await App.getCurrentFee();
      await App.getLastActiveThreads();
      await App.checkIfPaused();
    } catch {
      App.notifyUser("Cannot fetch contract data, please check your network and reload the page!");
    }

  },

  getCurrentFee: async function () {
      $("#feeNewThread").text(await App.contractInstance.feeNewThread.call().then(res => {return res.toNumber()}));
      $("#feeReplyThread").text(await App.contractInstance.feeReplyThread.call().then(res => {return res.toNumber()}));
  },

  checkIfPaused: function() {
    return App.contractInstance.isPaused.call().then(res => {
      return res;
    });
  },
  notifyUser: function(text) {
    $("#alertMessage").text(text);
    $("#alertRow").removeClass("d-none");
    setTimeout(function(){ $("#alertRow").addClass("d-none"); }, 8000);
  },

  getLastActiveThreads: async function(){
    for(var i = 0; i < 32; i++) {
      var threadId = await App.contractInstance.lastThreads.call(i).then(res => {return res.toNumber();});
      if(threadId != 0) {
        var threadObj = await App.contractInstance.threads(threadId).then(response => {
          App.findReplies(threadId, response[3].toNumber());
          return App.createThreadObject(threadId,response[0],response[1], response[2].toNumber(), response[3].toNumber(), response[4]);
        });
      }
      await App.pushToThreads(threadObj);
    }
    App.reloadAllCards();
    await App.listenToEvents();
  },

  findReplies: async function(threadId, index) {
    if(index != 0) {
      var replyObj = await App.contractInstance.replies(index).then(response => {
        return App.createReplyObject(index, response[2].toNumber(), response[0], response[1], response[3].toNumber(), response[4]);
      });
      App.pushToReplies(threadId, replyObj, replyObj.reply.replyId);
      if(replyObj.reply.nextReply != 0) {
        App.findReplies(threadId, replyObj.reply.nextReply);
      }
    }
  },

  nsfwToggle: function() {
    $("#nsfwToggle").change(function(){
      sessionStorage.setItem("showNsfw", $("#nsfwToggle").is(":checked"));
    });
    if(sessionStorage.getItem("showNsfw") == "true") {
     $("img").css({
       WebkitFilter: 'blur(0px)'
     });
     $("#nsfwToggle").prop("checked", true);
   } else {
    $("img").css({
      WebkitFilter: 'blur(20px)'
    });
   }

  },

  clearModalData() {
    App.imageUpload.val('');
    App.messageText.val('');
    App.previewContainer.attr("src", "");
    App.modalSubmit.off('click');
  },

  postNewThread: function() {
    var modalSubmit = $("#modalSubmit");
    var imageUpload = $("#imageUpload");
    var messageText = $("#messageText");
    var previewContainer = $("#previewContainer");
    var hash = null;
    App.clearModalData();
    imageUpload.on("change",function(){
      if(imageUpload[0].files.length != 0) {
        $.LoadingOverlay("show");
        let reader = new FileReader();
        reader.readAsArrayBuffer(imageUpload[0].files[0]);
        reader.onloadend = function() {
            var buf = buffer.Buffer(reader.result);
            App.ipfs.files.add(buf, (err, result) => {
              previewContainer.attr("src", "https://" + App.ipfsProvider + "/ipfs/" + result[0].hash);
              hash = result[0].hash;
              $.LoadingOverlay("hide");
            });
          }
      }
    });
    modalSubmit.click(function(e){
        if(hash != null) {
            App.createThread(messageText, hash);
        } else {
          App.createThread(messageText, "");
        }
        e.stopPropagation();
        e.preventDefault();
    });
  },

  replyToThread: function(threadId) {
    var modalSubmit = $("#modalSubmit");
    var imageUpload = $("#imageUpload");
    var messageText = $("#messageText");
    var previewContainer = $("#previewContainer");
    var hash = null;
    App.clearModalData();
    imageUpload.on("change",function(){
    if(imageUpload[0].files.length != 0) {
      $.LoadingOverlay("show");
      const reader = new FileReader();
      reader.readAsArrayBuffer(imageUpload[0].files[0]);
      reader.onloadend = function() {
          var buf = buffer.Buffer(reader.result)
          App.ipfs.files.add(buf, (err, result) => {
            previewContainer.attr("src", "https://" + App.ipfsProvider + "/ipfs/" + result[0].hash);
            hash = result[0].hash;
            $.LoadingOverlay("hide");
          });
        }
      }
    });
    modalSubmit.click(function(e){
        if(hash != null) {
          App.replyThread(threadId, messageText, hash);
        } else {
          App.replyThread(threadId, messageText, "");
        }
        e.stopPropagation();
        e.preventDefault();
    });
  },

  replyThread: async function(replyTo, text, ipfshash) {
    $('#Modal').modal('hide');
    if(await App.checkIfPaused()) {
      App.notifyUser("This DApp is Paused, please contact the administrator to enable it again.");
    } else {
      App.notifyUser("Transaction submitted; Waiting for the transaction to be mined");
      App.contractInstance.replyThread(replyTo, text.val(), ipfshash, {value: 100, from: App.account}).then(res => {});
    }
  },

  createThread: async function(text, ipfshash) {
    $('#Modal').modal('hide');
    if(await App.checkIfPaused()) {
      App.notifyUser("This DApp is Paused, please contact the administrator to enable it again.");
    } else {
      App.notifyUser("Transaction submitted; Waiting for the transaction to be mined");
      App.contractInstance.createThread(text.val(), ipfshash, {value: 1000, from: App.account}).then(res =>{});
    }
  },

  pushToThreads: function(threadObj) {
    for(var i = 0; i < App.lastActiveThreads.length; i++) {
        if(App.lastActiveThreads[i].threadId == threadObj.threadId) return;
    }
    App.lastActiveThreads.push(threadObj);
    if(App.lastActiveThreads.length > 32) {
      App.lastActiveThreads.pop();
    }
  },

  pushToReplies: function(threadId, replyObj, replyId) {
    for(var i = 0; i < App.lastActiveThreads.length; i++) {
      if(App.lastActiveThreads[i].threadId == replyObj.threadId) {
        for(var j = 0; j < App.lastActiveThreads[i].replies.length; j++) {
          if(App.lastActiveThreads[i].replies[j].replyId == replyObj.reply.replyId) {
            return;
          }
        }
        App.lastActiveThreads[i].lastUpdated = replyObj.reply.timestamp;
        App.lastActiveThreads[i].replies.push(replyObj.reply);
      }
    }
  },

  createThreadObject: function(id, text, ipfshash, indexFirstReply, indexLastReply, timestamp) {
    return {
      threadId: id,
      text: text,
      ipfshash: ipfshash,
      indexFirstReply: indexFirstReply,
      indexLastReply: indexLastReply,
      timestamp: timestamp,
      lastUpdated: timestamp,
      replies: []
    }
  },

  createReplyObject: function(replyId, replyTo, text, ipfshash, nextReply, timestamp) {
    return {
      threadId: replyTo,
      reply: {
        replyId: replyId,
        text: text,
        ipfshash: ipfshash,
        nextReply: nextReply,
        timestamp: timestamp
      }
    }
  },

  reloadAllCards: function(){
    $('#contentRow').empty();
    var threads = App.lastActiveThreads.sort(function(x, y){
        return y.lastUpdated.toNumber() - x.lastUpdated.toNumber();
    });
    $.each(threads, function(key, thread){
      if(key == 0) {
        $("#ribbon").addClass("d-none");
      } else {
        $("#ribbon").removeClass("d-none");
      }
      App.displayThreadCards(thread.text, thread.ipfshash, thread.timestamp.toNumber(), thread.threadId);
    });
  },

  reloadThreadPage: function(threadId) {
    $('#contentRow').empty();
    App.displayThreadPage(threadId);
  },

  displayThreadCards: function(text, ipfshash, timestamp, threadId) {
    if(ipfshash == "" || $.trim(ipfshash).length < 46) {
      ipfshash = "QmdrA4mUBg6bKnhhkTXBkbpEfEeqwTZLdBwi11Hx9Q5VhF";
    }
    var imgsrc = "https://" + App.ipfsProvider + "/ipfs/" + ipfshash;
    var contentRow = $('#contentRow');
    var cardTemplate = $('#cardTemplate');
    if($.trim(text).substring(0, 150).split(" ").length > 1 && $.trim(text).substring(0, 150).split(" ").length < 150){
        var shortText = $.trim(text).substring(0, 150).split(" ").slice(0, -1).join(" ") + " .....";
    }  else {
      var shortText = $.trim(text);
    }
    var datePosted = new Date(timestamp * 1000);
    cardTemplate.find('.card-text').text(shortText);
    cardTemplate.find('.card-img-top').attr('src', imgsrc);
    cardTemplate.find('.card-header').text("Posted : " + datePosted.toLocaleString());
    cardTemplate.find('.card').attr('id', threadId);
    cardTemplate.find('.card').removeClass('d-none');
    cardTemplate.find('.card').attr('onclick', 'App.displayThreadPage(' + threadId + ')');
    contentRow.append(cardTemplate.html());
  },

  displayThreadPage: function(threadId) {
    $("#createThread").addClass("d-none");
    $("#postReply").removeClass("d-none");
    $("#postReply").attr('onclick', 'App.replyToThread(' + threadId + ')');
    $.each(App.lastActiveThreads, function(key, thread){
      if(App.lastActiveThreads[key].threadId == threadId) {
        var threadTemplate = App.createThreadPage(thread.text, thread.ipfshash, thread.timestamp, thread.threadId);
        var contentRow = $('#contentRow');
        contentRow.find('.card').remove();
        contentRow.append(threadTemplate);
        $('#backToHome').removeClass('d-none');
        if(thread.replies.length > 0) {
          $.each(thread.replies, function(key, reply){
            contentRow.append(App.createThreadPage(reply.text, reply.ipfshash, reply.timestamp, "replyId_" + reply.replyId));
          });
        }
      }
    });
  },

  createThreadPage: function(text, ipfshash, timestamp, threadId) {
    if(ipfshash == "" || $.trim(ipfshash).length < 46) {
      ipfshash = "QmdrA4mUBg6bKnhhkTXBkbpEfEeqwTZLdBwi11Hx9Q5VhF";
    }
    var ipfsURL = "https://" + App.ipfsProvider + "/ipfs/" + ipfshash;
    var threadTemplate = $('#threadTemplate');
    var datePosted = new Date(timestamp.toNumber() * 1000);
    threadTemplate.find('#threadPostImg').attr('src', ipfsURL);
    threadTemplate.find('#threadPostImg').attr('onclick', 'App.openImage(' + '"' + ipfshash + '"' + ')');
    threadTemplate.find('#threadPostText').text(text);
    threadTemplate.find('#threadPostTimestamp').text("Posted : " + datePosted.toLocaleString());
    threadTemplate.find('.threadPost').attr('id', threadId);
    threadTemplate.find('.threadPost').removeClass('d-none');
    return threadTemplate.html();
  },

  openImage: function (ipfshash) {
    var ipfsURL = "https://" + App.ipfsProvider + "/ipfs/" + ipfshash;
    window.open(ipfsURL, '_blank');
  },

  listenToEvents: async function() {
    App.contractInstance.newThreadEvent({fromBlock: 'latest'}).watch(function(error, event) {
      //App.pushToThreads(App.createThreadObject(event.args.threadId.toNumber(),event.args.text,event.args.ipfsHash,event.args.timestamp));
      App.notifyUser("Somebody posted a new thread! Reload the page to view the latest threads.");
      //App.reloadAllCards();
    });

    App.contractInstance.newReplyEvent({fromBlock: 'latest'}).watch(function(error, event) {
      //console.log(event.args);
      //App.pushToReplies(event.args.replyTo.toNumber(), App.createReplyObject(event.args.replyId.toNumber(), event.args.replyTo, event.args.text, event.args.ipfsHash, event.args.timestamp), event.args.replyId.toNumber());
      App.notifyUser("Somebody posted a new reply! Reload the page to view the latest threads.");
      // App.reloadThreadPage(event.args.replyTo.toNumber());
    });
    // await App.getLastActiveThreads();
  }
};


$(function() {
  $(window).ready(function() {
    App.init();
    $("#nsfwToggle").on('change', function(){
        App.nsfwToggle();
    });
  });
});
