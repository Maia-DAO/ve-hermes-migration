const { ethers } = require('ethers');

// Setup ethers provider
const provider = new ethers.providers.JsonRpcProvider('https://metis-mainnet.g.alchemy.com/v2/FWmhvca-2KGl6D1o9YcToyEeO8Lmshcy');

const fs = require('fs')
const multicallAbi = require('./abis/multicall.json')

const VOTING_POWER_MINING_REJECT_ADDRESSES = [
  "0xeaec50ebe1c2a981ed8be02c36b0863fae322975",
  "0x9116b0ebb6c7a8ae201c725c27c87e5e546ed077",
  "0xc8819c553ff1781e017897800d75d82539a79aa2",
  "0x892bbe6e857c94410fea07e7acf14fec3de6e023",
  "0xf12093b5ba0e98466b28cd0ec612fec565b91eb9",
]

const ve_abi = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function tokensOfOwner(address _owner) external view returns (uint256[] memory)',
  'function locked(uint256 tokenId) external view returns (int128 amount, uint256 end)',
]

const ve_dist_abi = ['function claimable(uint256 _tokenId) external view returns (uint256)']

const multicallAddress = '0x5D78bF8f79A66e43f5932c1Ae0b8fA6563F97f74'

const veAddress = '0xa4C546c8F3ca15aa537D2ac3f62EE808d915B65b'

const veDistAddress = '0x04F783Ff9664bE99aE6fc8C8AeC379A287b27F67'

const veContract = new ethers.Contract(veAddress, ve_abi, provider)

const multicallContract = new ethers.Contract(multicallAddress, multicallAbi, provider)

const CREATION_BLOCK = 1324880
const MIGRATION_BLOCK = 18097914

const ADDRESSES_TO_IGNORE = new Set(['0x0000000000000000000000000000000000000000', ...VOTING_POWER_MINING_REJECT_ADDRESSES])

async function getHolders(veContract, fromBlock, toBlock) {
  console.log("Get Holders from events...")
  const logs = await fetchLogsInBatches(veContract, fromBlock, toBlock, 10000)

  const uniqueAddresses = new Set()
  for (const log of logs) {
    const from = ethers.utils.getAddress('0x' + log.topics[1].slice(26))
    const to = ethers.utils.getAddress('0x' + log.topics[2].slice(26))
    if (!ADDRESSES_TO_IGNORE.has(from)) uniqueAddresses.add(from)
    if (!ADDRESSES_TO_IGNORE.has(to)) uniqueAddresses.add(to)
  }

  return Array.from(uniqueAddresses)
}

async function fetchLogsInBatches(veContract, startBlock, endBlock, batchSize) {
  let currentBlock = startBlock
  let allLogs = []

  while (currentBlock <= endBlock) {
    const batchEndBlock = Math.min(currentBlock + batchSize - 1, endBlock)
    try {
      const filter = veContract.filters.Transfer()
      const logs = await veContract.queryFilter(filter, currentBlock, batchEndBlock)
      allLogs = allLogs.concat(logs)
      currentBlock = batchEndBlock + 1
    } catch (error) {
      console.error('Error fetching logs:', error)
      break
    }
  }
  return allLogs
}

async function batchCalls(calls, batchSize) {
  const results = []
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize)
    const { returnData } = await multicallContract.aggregate(batch, { blockTag: MIGRATION_BLOCK, gasLimit: 15000000 })
    results.push(...returnData)
  }
  return results
}

async function tryBatchCalls(calls, batchSize) {
  const requireSuccess = false

  const results = []
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize)
    const returnData = await multicallContract.tryAggregate(requireSuccess, batch, { blockTag: MIGRATION_BLOCK })
    results.push(...returnData)
  }
  return results
}

async function getTokenIdsForHolders(holders) {
  const batchSize = 500

  const calls = holders.map((holder) => ({
    target: veAddress,
    callData: new ethers.utils.Interface(ve_abi).encodeFunctionData('tokensOfOwner', [holder]),
  }))

  const returnData = await batchCalls(calls, batchSize)

  return holders
    .map((holder, index) => {
      const decoded = new ethers.utils.Interface(ve_abi).decodeFunctionResult('tokensOfOwner', returnData[index])[0]

      const tokenIds = decoded.map((id) => BigInt(id.toString()))

      return { holder, tokenIds }
    })
    .filter((holderData) => holderData.tokenIds.length > 0)
}

async function getLockedAndDistForTokenIds(tokenIds) {
  const batchSize = 500
  const batchSizeSmall = 100

  const callsLocked = tokenIds.flat().map((tokenId) => ({
    target: veAddress,
    callData: new ethers.utils.Interface(ve_abi).encodeFunctionData('locked', [tokenId]),
  }))

  const returnDataLocked = await batchCalls(callsLocked, batchSize)

  const callsClaimable = tokenIds.flat().map((tokenId) => ({
    target: veDistAddress,
    callData: new ethers.utils.Interface(ve_dist_abi).encodeFunctionData('claimable', [tokenId]),
  }))

  const returnDataClaimable = await tryBatchCalls(callsClaimable, batchSizeSmall)

  const flattenedTokenIds = tokenIds.flat()

  const decodedResults = returnDataLocked.map((data, index) => {
    const [amount, end] = new ethers.utils.Interface(ve_abi).decodeFunctionResult('locked', data)

    const claimableErrors = []

    let claimable = 0

    if (returnDataClaimable[index].success) {
      claimable = new ethers.utils.Interface(ve_dist_abi).decodeFunctionResult(
        'claimable',
        returnDataClaimable[index].returnData
      )
    } else {
      console.log("TOKEN WITH ISSUES FOUND!", flattenedTokenIds[index])
      claimableErrors.push(flattenedTokenIds[index].toString())
    }

    const lockedAmount = BigInt(amount.toString())

    const claimableAmount = BigInt(claimable.toString())

    return {
      tokenId: flattenedTokenIds[index],
      lockedAmount,
      claimableAmount,
      total: lockedAmount + claimableAmount,
      end: BigInt(end.toString()),
      claimableErrors
    }
  })

  const filteredResults = decodedResults.filter(({ lockedAmount }) => lockedAmount > 0n)

  let resultIndex = 0
  const groupedResults = tokenIds.map((ids) => {
    const group = filteredResults.slice(resultIndex, resultIndex + ids.length)
    resultIndex += ids.length
    return group
  })

  return groupedResults
}

async function consolidateData(holders) {
  const holdersWithTokens = await getTokenIdsForHolders(holders)

  const tokenIds = holdersWithTokens.map((holderData) => holderData.tokenIds)
  const lockedData = await getLockedAndDistForTokenIds(tokenIds)

  const consolidated = holdersWithTokens.map((holderData, index) => {
    const tokenLockedInfo = lockedData[index]
    const totalLocked = tokenLockedInfo
      .reduce((sum, { lockedAmount }) => sum + BigInt(lockedAmount), BigInt(0))
      .toString()
    const totalClaimable = tokenLockedInfo
      .reduce((sum, { claimableAmount }) => sum + BigInt(claimableAmount), BigInt(0))
      .toString()
    const total = tokenLockedInfo.reduce((sum, { total }) => sum + BigInt(total), BigInt(0)).toString()
    const tokensWithIssues = tokenLockedInfo.flatMap((info) => info.claimableErrors)

    return tokensWithIssues.length > 0 ? {
      holder: holderData.holder,
      tokens: holderData.tokenIds.map((id) => id.toString()), // Convert token IDs to strings
      totalLockedERC20: totalLocked,
      totalClaimableERC20: totalClaimable,
      totalERC20: total,
      tokensWithIssues
    }
      :
      {
        holder: holderData.holder,
        tokens: holderData.tokenIds.map((id) => id.toString()), // Convert token IDs to strings
        totalLockedERC20: totalLocked,
        totalClaimableERC20: totalClaimable,
        totalERC20: total
      }
  })

  return consolidated
}

const fromBlock = CREATION_BLOCK
const toBlock = MIGRATION_BLOCK

async function main() {
  try {
    const holders = await getHolders(veContract, fromBlock, toBlock)
    console.log('NFT Holders:', holders.length)

    const consolidatedData = await consolidateData(holders)
    console.log('Consolidated Data')

    fs.writeFileSync('locked_balances.json', JSON.stringify(consolidatedData, null, 2))
    console.log('Data saved to locked_balances.json')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
