// @flow
import { Router } from 'express'
import type { $Request, $Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import addLoginMiddlewares from './login/login-middleware'
import { setup as addGunMiddlewares, GunDBPrivate } from './gun/gun-middleware'
import addStorageMiddlewares from './storage/storageAPI'
import addVerificationMiddlewares from './verification/verificationAPI'
import logger from '../imports/pino-logger'

function wrapAsync(fn: Function) {
  return function(req: $Request, res: $Response, next: NextFunction) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

export { wrapAsync }
export default (app: Router, env: any) => {
  // parse application/x-www-form-urlencoded
  // for easier testing with Postman or plain HTML forms
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  )

  // parse application/json
  app.use(bodyParser.json())

  app.options(cors())
  app.use(cors())

  addLoginMiddlewares(app)
  addGunMiddlewares(app)
  addStorageMiddlewares(app, GunDBPrivate)
  addVerificationMiddlewares(
    app,
    {
      verifyUser(u, v) {
        return true
      }
    },
    GunDBPrivate
  )

  app.use((error, req, res, next: NextFunction) => {
    logger.error({ error })
    res.status(400).json({ message: error.message })
  })
}
