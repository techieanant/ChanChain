# ChanChain

An Imageboard is a type of Internet forum that revolves around the posting of images with minimal associated text. ChanChain is a 4chan inspired simple imageboard on Ethereum which uses IPFS to store images. Unlike other popular imageboards like 4chan and 8chan, ChanChain does not have different boards focused on various interests at this time. Uses can create threads or reply to existing threads by paying a small fee which is in place to prevent spam and support developer. Thirty two most recent and active threads are visible at any given time.

ChanChain was created for ConsenSys Academy’s 2018 Developer Program Final Project

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Ubuntu 16.04 Installation instructions

Run these commands in the order below on a clean Ubuntu installation or Virtual Machine:

```
sudo apt update
```

Install CURL:
```
sudo apt install curl
```

Download NodeJS:
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
```

Install NodeJS:
```
sudo apt-get install -y nodejs
```

Optional Commands if NodeJS and NPM don't get installed correctly:
```
node -v
npm -v
sudo apt install nodejs
sudo apt install npm
```

Install Truffle node package globally:
```
sudo npm install -g truffle
```

Install git to clone the repository:
```
sudo apt-get install git
```

Traverse to the ChanChain repository and install dependencies:
```
npm install
```

If "truffle develop" doesn't work, install truffle again:
```
npm install truffle
```

### Prerequisites

Use the Powershell or CMD on Windows with Administrator privileges and install:
windows-build-tools
node
truffle

```
npm install windows-build-tools
```

```
npm install truffle -g
```

### Running

On the project directory you have to execute:

```
truffle develop
```

You can also copy the ChanChain.sol contract code and paste it in Remix.
After that you can compile and test the contract in the truffle console:

```
compile
```
```
migrate --reset
```
```
test
```

Start a development server and interact with UI by typing

```
npm run dev
```

## Built With

* [Truffle](https://truffleframework.com/)
