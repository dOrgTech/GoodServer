// @flow
import { Router } from 'express'
import passport from 'passport'
import { wrapAsync } from '../utils/helpers'
import { isHuman, setWeb3Provider, proposeAdd, proposeUpdate } from '@dorgtech/id-dao-client'

// TODO: make this middleware like gundb?
import IPFSClient from 'ipfs-http-client'
const ipfs = IPFSClient('127.0.0.1', process.env.ID_DAO_IPFS_PORT)

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
        throw new Error('address not supplied')
      }

      const result = await isHuman(address)

      res.json({
        isHuman: result
      })
    })
  )

  /**
   * @api {post} /id-dao/propose-add Propose adding human
   * @apiName Propose human to DAO
   * @apiGroup Identity DAO
   *
   * @apiParam {String} identityDefinition
   * @apiParam {String} signature
   *
   * @apiSuccess {String} proposalId
   * @ignore
   */
  app.post(
    '/id-dao/propose-add',
    passport.authenticate('jwt', { session: false }),
    wrapAsync(async (req, res, next) => {
      const { body, log } = req

      log.debug('/id-dao/propose-add', 'proposing')
      log.debug('/id-dao/propose-add', 'body: ', body)

      if (!body.signature) {
        throw new Error('signature not supplied')
      }

      if (!body.identityDefinition) {
        throw new Error('identityDefinition not supplied')
      }

      const identity = JSON.parse(body.identityDefinition)
      const signature = body.signature

      const ipfsRes = await ipfs.add(Buffer.from(JSON.stringify(identity)))

      if (ipfsRes.length === 0) {
        const error = 'Error uploading to IPFS, no response'
        log.error(error)

        res.json({
          ok: 1,
          error
        })
      } else {
        const hash = ipfsRes[0].path
        const proposalId = await proposeAdd(identity.address, hash, signature, {
          title: `GoodDollar: Add '${identity.name}'`
        })

        res.json({
          proposalId
        })
      }
    })
  )

  /**
   * @api {post} /id-dao/propose-update Propose update human
   * @apiName Propose upated human to DAO
   * @apiGroup Identity DAO
   *
   * @apiParam {String} identityDefinition
   * @apiParam {String} signature
   *
   * @apiSuccess {String} proposalId
   * @ignore
   */
  app.post(
    '/id-dao/propose-update',
    passport.authenticate('jwt', { session: false }),
    wrapAsync(async (req, res, next) => {
      const { body, log } = req

      log.debug('/id-dao/propose-update', 'proposing')
      log.debug('/id-dao/propose-update', 'body: ', body)

      if (!body.signature) {
        throw new Error('signature not supplied')
      }

      if (!body.identityDefinition) {
        throw new Error('identityDefinition not supplied')
      }

      const identity = JSON.parse(body.identityDefinition)
      const signature = body.signature

      const ipfsRes = await ipfs.add(Buffer.from(JSON.stringify(identity)))

      if (ipfsRes.length === 0) {
        const error = 'Error uploading to IPFS, no response'
        log.error(error)

        res.json({
          ok: 1,
          error
        })
      } else {
        const hash = ipfsRes[0].path
        const proposalId = await proposeUpdate(identity.address, hash, signature, {
          title: `GoodDollar: Update '${identity.name}'`
        })

        res.json({
          proposalId
        })
      }
    })
  )

  // TODO: store proposal ID and check status
  /*
  app.post(
    '/id-dao/proposal-status'

    address
  )*/
}

export default setup
