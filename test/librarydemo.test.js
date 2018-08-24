var LibraryDemo = artifacts.require("./LibraryDemo.sol");

contract('LibraryDemo', function(accounts){

const owner = accounts[0];
const number1 = 4;
const number2 = 6;
const expectedResult = 10;

var contract;

beforeEach(function() {
   return LibraryDemo.new({from: owner})
   .then(function(instance) {
      contract = instance;
   });
});

it("thatAdd(): Adds two numbers using the library function", async () => {
  contract.thatAdd(number1, number2)
    .then(data => {assert.equal(data.toNumber(), expectedResult, 'Adding 6 and 4 should equal 10 with library');});
});

it("thisAdd(): Adds two numbers using normal addition", async () => {
  contract.thisAdd(number1, number2)
    .then(data => {assert.equal(data.toNumber(), expectedResult, 'Adding 6 and 4 should equal 10 without library as well');});
});

});
