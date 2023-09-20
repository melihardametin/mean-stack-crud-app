const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define collection and schema
let User = new Schema({
   
   name: {
      type: String
   },
   surname: {
      type: String
   },
   username: {
      type: String
   },
   email: {
      type: String
   },
   birthday: {
      type: String
   },
   city: {
      type: String
   },
   password: {
      type: String
   },
   admin: {
      type: Boolean
   },
   token: {
      type: String
   }
}, {
   collection: 'users'
})
module.exports = mongoose.model('User', User)