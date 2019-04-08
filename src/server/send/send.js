// @flow
import sgMail from '@sendgrid/mail'
import * as plivo from 'plivo'

import conf from '../server.config'
import logger from '../../imports/pino-logger'
import type { UserRecord } from '../../imports/types'
import { generateOTP } from '../../imports/otp'

sgMail.setApiKey(conf.sendGrid.apiKey)

const log = logger.child({ from: 'AdminWallet' })

export const sendLinkByEmail = (to: string, link: string) => {
  const text = `You got GD. To withdraw open: ${link}`
  const msg = {
    to,
    from: conf.noReplyEmail,
    subject: 'Sending GD via Good Dollar App',
    html: text,
    text
  }
  return sgMail.send(msg).catch(error => {
    //Log friendly error
    log.error(error.toString())
    throw error
  })
}

export const sendLinkBySMS = (to: string, link: string) => {
  console.log({ conf })
  const { plivoAuthID, plivoAuthToken, plivoPhoneNumber } = conf
  const client = new plivo.Client(plivoAuthID, plivoAuthToken)
  const text = `You got GD. To withdraw open: ${link}`

  return client.messages.create(plivoPhoneNumber, to, text)
}

export const sendEmailConfirmationLink = (user: UserRecord) => {
  const validationHash = generateOTP(10)
  const validationLink = `${conf.walletUrl}/Signup/EmailConfirmation/?validation=${validationHash}`
  const msg: any = {
    personalizations: [
      {
        dynamic_template_data: {
          receiver_name: user.fullName,
          validation_link: validationLink
        },
        to: [
          {
            email: user.email,
            name: user.fullName
          }
        ]
      }
    ],
    from: {
      email: conf.noReplyEmail
    },
    template_id: conf.sendGrid.templates.emailConfirmation
  }

  log.debug({ msg })

  return sgMail
    .send(msg)
    .then(() => validationHash)
    .catch(error => {
      //Log friendly error
      log.error(error.toString())
      throw error
    })
}
