
$(window).on("ready load change", function(){
  setInterval(detectWeb3,1000);

});



const contract = $.getJSON( "./build/contracts/ChanChain.json", function(data) {
  return data;
});

console.log(contract);

function detectWeb3(){
  if (typeof web3 !== 'undefined' && web3.eth.accounts.length > 0) {
    web3js = new Web3(web3.currentProvider);
    $("#alertRow").addClass("d-none");
    updateAccountDetails();
  } else {
    $("#alertRow").removeClass("d-none");  }
}


function updateAccountDetails() {
  if(web3js.eth.defaultAccount) {
    $("#wallet-address").text(web3js.eth.defaultAccount);
    web3js.eth.getBalance(web3js.eth.defaultAccount, function(error, result){
      if(result) {
        $("#wallet-balance").text(web3.fromWei(result, "ether"));
      } else {
        $("#wallet-balance").text("Null");
        console.log("Cannot get Balance; Check Metamask connection!")
      }
    })
  } else {
    $("#wallet-balance").text("Null");
    $("#wallet-address").text("Null");
  }
}

$(".card").click(function(){
  alert("AsdaSD");
});
