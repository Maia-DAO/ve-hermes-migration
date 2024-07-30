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
        url: 'https://metis-mainnet.g.alchemy.com/v2/eVwGTWHeufvv7GF6TS2L7vCPbgy0JXaP',
        blockNumber: 17875736,
      },
    },
  },
}
