import mongoose from 'mongoose'

import config from '../server.config'

const { uri } = config.mongodb

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true })

export default mongoose
