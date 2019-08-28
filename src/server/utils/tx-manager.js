import config from '../server.config'
import queueMongo from './tx-manager/queueMongo'
import queueMutex from './tx-manager/queueMutex'

const network = config.network
const LOCAL_NETWORK = 'develop'

class TransactionRun {
  /**
   * Return manager instance
   *
   * @returns {*}
   */
  static getManagerInstance() {
    let queueManager = null

    switch (network) {
      case LOCAL_NETWORK:
        queueManager = new queueMutex()
        break

      default:
        queueManager = new queueMongo()
        break
    }

    return queueManager
  }
}

export default TransactionRun.getManagerInstance()
