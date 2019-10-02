// @flow
import { Router } from 'express'
import passport from 'passport'
import { wrapAsync } from '../utils/helpers'
import AdminWallet from '../blockchain/AdminWallet'
import { isHuman, setWeb3Provider } from '@dorgtech/id-dao-client'

const setup = (app: Router, storage: StorageAPI) => {
  // TODO: add "main-net" provider to AdminWallet
  setWeb3Provider('http://localhost:9545')

  /**
   * @api {post} /id-dao/is-human Is address human
   * @apiName Is human
   * @apiGroup Identity DAO
   *
   * @apiParam {String} address
   *
   * @apiSuccess {Boolean} isHuman
   * @ignore
   */
  app.post(
    '/id-dao/is-human',
    passport.authenticate('jwt', { session: false }),
    wrapAsync(async (req, res, next) => {
      const { body, log } = req

      log.debug('/id-dao/is-human', 'checking')
      log.debug('/id-dao/is-human', 'body: ', body)

      const address = body.address

      if (!address) {
        throw new Error('Address not supplied')
      }

      const result = await isHuman(address)

      res.json({
        isHuman: result
      })
    })
  )

  /*app.post(
    '/id-dao/propose-add'

    identityDefinition
    signature
  )

  app.post(
    '/id-dao/propose-edit'

    identityDefinition
    signature
  )

  app.post(
    '/id-dao/proposal-status'

    address
  )*/

  /*

- [Identity DAO](#id-dao)
	- [Propose add identity](#propose-add-id)
	- [Propose edit identity](#propose-edit-id)
	- [Proposal status](#proposal-status)

*/
}

export default setup
