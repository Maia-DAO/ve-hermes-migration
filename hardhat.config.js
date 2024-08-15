require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: '0.8.0',
  networks: {
    hardhat: {
      chains: {
        1088: {
          hardforkHistory: {
            berlin: 10000000,
            london: 15000000,
          },
        },
      },
      forking: {
        url: 'https://metis-mainnet.g.alchemy.com/v2/FWmhvca-2KGl6D1o9YcToyEeO8Lmshcy',
        blockNumber: 18097914,
      },
    },
  },
}
