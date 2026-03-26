import mongoose from 'mongoose';

export const mongoConnections = {
  'branch-1': false,
  'branch-2': false,
};

export const initializeMongoConnections = () => {
  if (process.env.MONGODB_URI_BRANCH1) {
    const conn1 = mongoose.createConnection(process.env.MONGODB_URI_BRANCH1, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    conn1.on('connected', () => {
      mongoConnections['branch-1'] = true;
      console.log('MongoDB connected for Branch 1');
    });
    conn1.on('error', (err) => {
      console.error('MongoDB connection error for Branch 1:', err.message);
      mongoConnections['branch-1'] = false;
    });
    conn1.on('disconnected', () => {
      console.log('MongoDB disconnected for Branch 1');
      mongoConnections['branch-1'] = false;
    });
  }

  if (process.env.MONGODB_URI_BRANCH2) {
    mongoose.connect(process.env.MONGODB_URI_BRANCH2, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then(() => {
        mongoConnections['branch-2'] = true;
        console.log('MongoDB connected for Branch 2');
      })
      .catch((err) => {
        console.error('MongoDB connection error for Branch 2:', err.message);
        mongoConnections['branch-2'] = false;
      });
  }
};
