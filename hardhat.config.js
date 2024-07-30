require("@nomiclabs/hardhat-ethers");
require('dotenv').config();


const prvkey = process.env.PRIVATE_KEY ?? '';

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chains: {
        1088: {
          hardforkHistory: {
            berlin: 10000000,
            london: 15000000,
          },
        }
      },
      forking: {
        accounts: [prvkey],
        url: "https://metis-pokt.nodies.app",
        blockNumber: 17706711
      }
    },
    metis: {
      url: "https://metis-pokt.nodies.app",
      accounts: [prvkey],
      chainId: 1088
    }
  }
};
