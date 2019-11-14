// @flow
import fs, { createWriteStream } from 'fs'
import { Router } from 'express'
import passport from 'passport'
import multer from 'multer'
import _ from 'lodash'
import multihashing from 'multihashing-async'
import CIDTool from 'cid-tool'
import https from 'https'
import url from 'url'
import {
  IdentityDefinitionForm,
  deserialize,
  isHuman,
  getEnabledWeb3,
  setWeb3Provider,
  proposeAdd,
  recoverSig,
  setIdDaoProxy,
  getAccount,
  getGenericScheme,
  idDaoAddresses
} from '@dorgtech/id-dao-client'

// import get from 'lodash/get'
import { type StorageAPI, UserRecord } from '../../imports/types'
import { wrapAsync } from '../utils/helpers'
import { getNetworkName } from '@dorgtech/id-dao-client/dist/utils/web3Utils'

// import { defaults } from 'lodash'
// import jwt from 'jsonwebtoken'
// import fetch from 'cross-fetch'
// import md5 from 'md5'
// import { Mautic } from '../mautic/mauticAPI'
// import conf from '../server.config'
// import AdminWallet from '../blockchain/AdminWallet'
// import { recoverPublickey } from '../utils/eth'
// import zoomHelper from '../verification/faceRecognition/faceRecognitionHelper'
// import crypto from 'crypto'
// import { config } from 'winston'

const setup = (app: Router, storage: StorageAPI) => {
  var upload = multer({ dest: 'uploads/' })
  setWeb3Provider('http://localhost:8545')
  setIdDaoProxy('http://localhost:3003/id-dao/verify')
  /**
   * @api {post} /user/add Add user account
   * @apiName Add
   * @apiGroup Storage
   *
   * @apiParam {Object} user
   *
   * @apiSuccess {Number} ok
   * @ignore
   */
  app.post(
    '/id-dao/propose-add',
    passport.authenticate('jwt', { session: false }),
    upload.any(),
    wrapAsync(async (req, res, next) => {
      const log = req.log.child({ from: '/id-dao/propose' })
      const { body, files } = req
      const form = deserialize(body.form)
      const signature = body.signature
      const formHash = CIDTool.format(await multihashing(Buffer.from(body.form), 'sha2-256'))
      if (formHash !== body.hash) {
        log.error('calculated hash ', formHash, ' does not equal signed hash', body.hash)
        return false
      }
      const sigAddress = await recoverSig(formHash, signature)
      if (sigAddress !== form.address) {
        // check if signed
        log.error('signed address', sigAddress, ' does not equal user address', form.address)
        return false
      }
      let uploadKeys = Object.keys(form.uploads)
      for (let i = 0; i < uploadKeys.length; i++) {
        // check if photos match
        const key = uploadKeys[i]
        const uploadPath = _.get(_.find(files, { fieldname: key }), 'path', '')
        const uploadFile = fs.readFileSync(uploadPath)
        const mh = CIDTool.format(await multihashing(uploadFile, 'sha2-256'))
        if (mh != form.uploads[key].hash) {
          log.debug(key + 'does not match hash')
          res.json({ ok: 0, error: key + ' does not match hash' })
          return false
        }
      }
      const idForm = new IdentityDefinitionForm()
      idForm.data = form
      const idRes = idForm.validate()
      if (idRes.hasError) {
        let message = ''
        Object.keys(form.socialPosts).forEach(key => {
          const error = idForm.$.socialPosts.$[key].error
          if (error) {
            message = message + error + '\n'
          }
        })
        res.json({ ok: 0, error: 'Invalid identity', message })
        return false
      }
      let tx = await proposeAdd(form.address, formHash, signature, {
        title: `GoodDollar: Update '${form.name}'`
      })
      res.json({ ok: 1, tx })
    })
  )

  app.get(
    '/id-dao/verify/twitter/:user/status/:post',
    wrapAsync(async (req, res, next) => {
      const log = req.log.child({ from: '/id-dao/propose' })
      const { body } = req
      log.debug(req.url)
      log.debug('url: https://twitter.com/' + req.params.user + '/status/' + req.params.post)
      var creq = https
        .request('https://twitter.com/' + req.params.user + '/status/' + req.params.post, function(cres) {
          // set encoding
          cres.setEncoding('utf8')
          res.writeHead(cres.statusCode)
          // wait for data
          cres.on('data', function(chunk) {
            res.write(chunk)
          })

          cres.on('close', function() {
            res.end()
          })

          // cres.on('end', function() {
          //   // finished, let's finish client request as well
          //   res.writeHead(cres.statusCode)
          //   res.end()
          // })
        })
        .on('error', function(e) {
          // we got an error, return 500 error to client and log error
          console.log(e.message)
          res.writeHead(500)
          res.end()
        })

      creq.end()
    })
  )
  app.get(
    '/id-dao/verify/gist/:post',
    wrapAsync(async (req, res, next) => {
      const log = req.log.child({ from: '/id-dao/propose' })
      const { body } = req
      log.debug(req.url)
      log.debug('url: https://gist.github.com/' + req.params.post)
      var creq = https
        .request('https://gist.github.com/' + req.params.post, function(cres) {
          log.debug('redirect', cres.headers.location)
          if (cres.statusCode > 300 && cres.statusCode < 400 && cres.headers.location) {
            // The location for some (most) redirects will only contain the path,  not the hostname;
            // detect this and add the host to the path.
            if (url.parse(cres.headers.location).hostname) {
              var creq = https
                .request(cres.headers.location, function(cres) {
                  cres.setEncoding('utf8')
                  res.writeHead(cres.statusCode)
                  // wait for data
                  cres.on('data', function(chunk) {
                    res.write(chunk)
                  })

                  cres.on('close', function() {
                    res.end()
                  })

                  // cres.on('end', function() {
                  //   // finished, let's finish client request as well
                  //   res.writeHead(cres.statusCode)
                  //   res.end()
                  // })
                })
                .on('error', function(e) {
                  // we got an error, return 500 error to client and log error
                  console.log(e.message)
                  res.writeHead(500)
                  res.end()
                })
              creq.end()
            } else {
              log.debug('else')
            }

            // Otherwise no redirect; capture the response as normal
          } else {
            // set encoding
            cres.setEncoding('utf8')
            res.writeHead(cres.statusCode)
            // wait for data
            cres.on('data', function(chunk) {
              res.write(chunk)
            })

            cres.on('close', function() {
              res.end()
            })
          }

          // cres.on('end', function() {
          //   // finished, let's finish client request as well
          //   res.writeHead(cres.statusCode)
          //   res.end()
          // })
        })
        .on('error', function(e) {
          // we got an error, return 500 error to client and log error
          console.log(e.message)
          res.writeHead(500)
          res.end()
        })

      creq.end()
    })
  )
}

export default setup
