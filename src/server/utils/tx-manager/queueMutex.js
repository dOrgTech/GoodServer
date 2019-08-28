import Mutex from 'await-mutex'

export default class queueMutex {
  constructor() {
    this.nonce = null
    this.mutex = new Mutex()
  }

  init(address, nonce) {
    this.nonce = nonce
  }
  /**
   * lock for queue
   * @param address
   * @param netNonce
   * @returns {Promise<any>}
   */
  async lock(address) {
    this.nonce++

    let release = await this.mutex.lock()

    return {
      nonce: this.nonce,
      release: release,
      fail: () => {
        this.nonce--
        release()
      }
    }
  }
}
