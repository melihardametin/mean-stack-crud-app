const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define collection and schema
let Log = new Schema({
   
   username: {
      type: String
   },
   operation: {
      type: String
   },
   date: {
      type: String
   },

}, {
   collection: 'logs'
})
module.exports = mongoose.model('Log', Log)