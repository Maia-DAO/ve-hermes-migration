require("@nomiclabs/hardhat-ethers");

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
        url: "https://metis-pokt.nodies.app",
        blockNumber: 17706711
      }
    },
    metis: {
      url: "https://metis-pokt.nodies.app",
    }
  }
};
