import mongoose from 'mongoose'

import config from './server.config'

const { uri } = config.mongodb
mongoose.Promise = Promise
mongoose.db = mongoose.createConnection(uri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
})

export default mongoose
