const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define collection and schema
let Message = new Schema({
   
   from: {
      type: String
   },
   to: {
      type: String
   },
   title: {
      type: String
   },
   content: {
      type: String
   },
   date: {
      type: String
   },
   is_deleted: {
      type: Boolean
   },

}, {
   collection: 'messages'
})
module.exports = mongoose.model('Message', Message)