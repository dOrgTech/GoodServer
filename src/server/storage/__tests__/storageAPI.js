// @flow
import request from 'supertest'
import makeServer from '../../server-test'
import { getToken } from '../../__util__/'
import type { UserRecord } from '../../../imports/types'

jest.setTimeout(30000)
describe('storageAPI', () => {
  let server
  beforeAll(done => {
    server = makeServer(done)
  })

  afterAll(done => {
    server.close(err => {
      console.log({ err })
      done()
    })
  })

  test('/user/add creds', async () => {
    const token = await getToken(server)
    const user: UserRecord = {
      identifier: '0x7ac080f6607405705aed79675789701a48c76f55',
      email: 'useraddtest@gooddollar.org' // required for mautic create contact
    }
    let res = await request(server)
      .post('/user/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ user })
    expect(res).toMatchObject({ status: 200, body: { ok: 1 } })
  })

  test('/user/add false creds', async () => {
    const token = await getToken(server)
    const user: UserRecord = { identifier: '0x7ac080f6607405705aed79675789701a48c76f56' }
    let res = await request(server)
      .post('/user/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ user })
    expect(res).toMatchObject({ status: 400 })
  })

  test('/user/upload-content', async done => {
    const token = await getToken(server)
    request(server)
      .post('/user/upload-content')
      .set('Authorization', `Bearer ${token}`)
      .attach('content', __dirname + '/test.jpg')
      .then(res => {
        expect(res).toMatchObject({
          status: 200,
          body: {
            ok: 1,
            contentHash: 'QmYzP4aV7RUYGo5X1BAYS3V8MEjwT29734Q4JAixad5jau'
          }
        })
      })
      .catch(err => console.log(err))
      .finally(done)
  })
})
