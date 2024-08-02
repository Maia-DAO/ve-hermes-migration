# veHERMES NFT Balance Checker

## Overview

This project retrieves and consolidates data about NFT holders and the ERC20 tokens locked in their NFTs as well as bribes in $MAIA, $HERMES or $starHERMES.
It uses Hardhat and a multicall contract to perform batch calls to the blockchain, checking the state at a specific historical block.

## Prerequisites

- **Node.js** (version 18.x or later)
- **Yarn** or **npm** (package managers)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Maia-DAO/migrate-ve-hermes.git
```

### 2. Install Dependencies

```bash
yarn
# or
npm i
```

### 3. Update Hardhat Configuration

Before running the get balances script, you need to change the migrationBlock in ìndex.js` configure Hardhat to use the appropriate network and block number for forking.

Open `hardhat.config.js` and ensure the forking configuration is set correctly:

```javascript
module.exports = {
  solidity: '0.8.0',
  networks: {
    hardhat: {
      forking: {
        url: 'https://metis-pokt.nodies.app',
        blockNumber: 17706711, // Update this block number as needed
      },
    },
  },
}
```

### 3. Update Pool Lists in `getBribes.js`

Before running the get bribes script, you need to update the tokenLists in getBribes.js with the values inside `pairs.txt`in the `metis-migration` repository output by the command `yarn run filter-pairs`.

## Balances Script

The script retrieves NFT holders, checks their token IDs, and determines the amount of ERC20 tokens locked in each NFT. The results are consolidated and saved to a JSON file.

### `index.js`

This is the main script that performs the following tasks:

1. Fetches NFT holders.
2. Retrieves token IDs for each holder.
3. Queries locked ERC20 tokens for each token ID.
4. Consolidates the data and saves it to `consolidatedData.json`.

### Running the Script

To execute the script, use the following command:

```bash
yarn get-balances
```

### Script Details

- **`getTokenIdsForHolders(holders, blockNumber)`**: Retrieves token IDs for a list of NFT holders at the specified block number.
- **`getLockedERC20TokensForTokenIds(tokenIds, blockNumber)`**: Fetches the amount of ERC20 tokens locked in each NFT token ID at the specified block number.
- **`consolidateData(holders)`**: Consolidates the retrieved data and computes the total locked ERC20 tokens per holder.

## JSON Output

The results are saved to `consolidatedData.json` in the following format:

```json
[
  {
    "holder": "0x1234567890abcdef1234567890abcdef12345678",
    "tokens": ["1", "2", "3"],
    "totalLockedERC20": "123456789012345678901234567890"
  }
]
```

- `holder`: The Ethereum address of the NFT holder.
- `tokens`: A list of token IDs owned by the holder.
- `totalLockedERC20`: The total amount of ERC20 tokens locked in the NFTs held by the address.

## Bribes Script

The script retrieves pending bribes for each NFT. The results are consolidated and saved to a JSON file.

### `getBribes.js`

This is the main script that performs the following tasks:

1. Loads NFT holders and relevant pools.
2. Retrieves gauge and bribe contracts for each pool.
3. Queries pending bribes of $MAIA, $HERMES or $starHERMES for each token ID.
4. Consolidates the data and saves it to `pending_rewards_[TOKEN_ADDRESS].json`.

### Running the Script

To execute the script, use the following command:

```bash
yarn get-bribes
```

## JSON Output

The results are saved to `consolidatedData.json` in the following format:

```json
[
  {
    "account": "0x1234567890abcdef1234567890abcdef12345678",
    "token": "1",
    "pendingReward": "123456789012345678901234567890"
  }
]
```

- `account`: The Ethereum address of the NFT holder.
- `tokens`: Token ID owned by the holder.
- `pendingReward`: The amount of bribes.

## Contributing

Feel free to contribute by creating issues or pull requests. Your feedback and contributions are welcome!

## License

This project is licensed under the MIT License.

---# ve-hermes-migration
