const mongoose = require('mongoose');


//msg model
const msgSchema = new mongoose.Schema({
  roomName : {
    type: String,
    required: true
  
  },
  user: {
    type: String,
    required: true, 
    
  },
  message: {
    type: String,
    required: true, 
    
  }
});

module.exports = mongoose.model('msg', msgSchema)