import mongoose from 'mongoose';
import { version } from '../version.json';

function status(req, res) {
  if (mongoose.connection.readyState === 0) {
    // mongo is down so we need to restart the pod to repair the connection
    res.status(500);
    res.json({ message: 'Mongo down', version });
  } else {
    res.json({ message: 'OK', version });
  }
}

export default { status };
