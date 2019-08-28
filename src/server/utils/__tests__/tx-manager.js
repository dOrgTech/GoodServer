// @flow
import queueMongo from '../tx-manager/queueMongo'
import WalletNonce from '../../models/wallet-nonce'
import { MODEL_WALLET_EXPIRE } from '../../models/constants'
import config from '../../server.config'
let txManagerMongo

const prefixTestAddress = 'test'

jest.setTimeout(350000)
const Timeout = (timeout: msec) => {
  return new Promise((res, rej) => {
    setTimeout(rej, timeout, new Error('Request Timeout'))
  })
}
beforeAll(async () => {
  txManagerMongo = new queueMongo()
})

afterAll(async () => {
  await WalletNonce.deleteMany({ address: new RegExp(prefixTestAddress, 'i') })
})

test('lock should release on success', async () => {
  let netNonce = 0
  const testAddress = `${prefixTestAddress} - ${Date.now()}`
  txManagerMongo.init(testAddress, netNonce)
  for (let i = 0; i < 5; i++) {
    const { nonce, release, fail } = await txManagerMongo.lock(testAddress)
    release()
    expect(nonce === i).toBeTruthy()
  }
})

test('lock should release on fail', async () => {
  let netNonce = 0
  const testAddress = `${prefixTestAddress} - ${Date.now()}`
  txManagerMongo.init(testAddress, netNonce)
  for (let i = 0; i < 5; i++) {
    const { nonce, release, fail } = await txManagerMongo.lock(testAddress, netNonce)
    console.log('got lock 2', { nonce })
    fail()

    expect(nonce === 0).toBeTruthy()
  }
})

test('nonce should be in correct order', async () => {
  let netNonce = 0
  const testAddress = `${prefixTestAddress} - ${Date.now()}`
  txManagerMongo.init(testAddress, netNonce)
  let nowNetNonce = netNonce

  for (let i = 0; i < 10; i++) {
    const { nonce, release, fail } = await txManagerMongo.lock(testAddress, netNonce)
    console.log('got lock 3', { nonce })

    if (i % 2 === 0) {
      release()
    } else {
      fail()
    }
    nowNetNonce = nonce
  }

  expect(nowNetNonce === 5).toBeTruthy()
})

test('lock should release after ttl', async () => {
  let netNonce = 0
  const testAddress = `${prefixTestAddress} - ${Date.now()}`
  txManagerMongo.init(testAddress, netNonce)
  let txManagerMongo2 = new queueMongo()
  const start = Date.now()
  const { nonce, release, fail } = await txManagerMongo.lock(testAddress, netNonce)
  const { nonce: nonce2, release: release2, fail: fail2 } = await txManagerMongo2.lock(testAddress, netNonce)
  const end = Date.now()
  release2()
  expect(end - start >= MODEL_WALLET_EXPIRE).toBeTruthy()
  expect(nonce === 0).toBeTruthy()
})
