const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const messageRoute = express.Router();
// Message model
let Message = require('../models/Message');
let User = require('../models/User');


// Delete message
messageRoute.route('/delete_message/:msg_id').delete(verifyToken, (req, res, next) => {
  const { msg_id } = req.params;

  Message.findByIdAndUpdate(msg_id, { is_deleted: true }, { new: true })
    .then((updatedMessage) => {
      if (!updatedMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }
      res.json(updatedMessage);
    })
    .catch((error) => {
      return next(error);
    });
});



// Add Message
messageRoute.route('/send').post(verifyToken, (req, res, next) => {
  Message.create(req.body)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      return next(error);
    });
});

// Get Inbox
messageRoute.route('/inbox/:username').get(verifyToken, async (req, res, next) => {
  try {
    const { page } = req.query;
    const { username } = req.params;
    const { sort_by} = req.query;
    const { sort_type } = req.query;
    sort_Type = parseInt(sort_type);
    const pageNumber = parseInt(page) || 1;
    const totalMessages = await Message.countDocuments({ to: username });
    const totalPages = Math.ceil(totalMessages / 10);

    const sortingCriteria = {};
    if (sort_by === 'date') {
      sortingCriteria.date = sort_type === '1' ? 1 : -1; 
    } else if (sort_by === 'content') {
      sortingCriteria.content = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'title') {
      sortingCriteria.title = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'sender') {
      sortingCriteria.sender = sort_type === '1' ? 1 : -1;
    }

    const inboxMessages = await Message.find({ to: username}).sort(sortingCriteria).skip((pageNumber-1)*10).limit(10);
    res.json({
      totalMessages: totalMessages,
      totalPages: totalPages,
      currentPage: pageNumber,
      messages: inboxMessages
    });
  } catch (error) {
    console.error('Error retrieving inbox messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Get Outbox
messageRoute.route('/outbox/:username').get(verifyToken, async (req, res, next) => {
  try {
    const { page } = req.query;
    const { username } = req.params;
    const { sort_by} = req.query;
    const { sort_type } = req.query;
    sort_Type = parseInt(sort_type);
    const pageNumber = parseInt(page) || 1;
    const totalMessages = await Message.countDocuments({ from: username });
    const totalPages = Math.ceil(totalMessages / 10);

    const sortingCriteria = {};
    if (sort_by === 'date') {
      sortingCriteria.date = sort_type === '1' ? 1 : -1; 
    } else if (sort_by === 'content') {
      sortingCriteria.content = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'title') {
      sortingCriteria.title = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'sender') {
      sortingCriteria.sender = sort_type === '1' ? 1 : -1;
    }

    const outboxMessages = await Message.find({ from: username}).sort(sortingCriteria).skip((pageNumber-1)*10).limit(10);
    res.json({
      totalMessages: totalMessages,
      totalPages: totalPages,
      currentPage: pageNumber,
      messages: outboxMessages
    });
  } catch (error) {
    console.error('Error retrieving outbox messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// verifyToken middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];

  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, 'secretkey', (err, decoded) => {
      if (err) {
        res.sendStatus(403); // Invalid token
      } else {
        const {username} = decoded;
        User.findOne({ username: username })
    .then((user) => {
      if (user) {
        console.log(user.username);
        console.log(username);
        if (user.username === username) {
          req.authData = user;
        next();
        }
      } else {
        // User not found
        res.status(200).json({ valid: false });
      }
    })
    .catch((error) => {
      // Error handling
      console.log('Error searching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    });
      }
    });
  } else {
    res.sendStatus(403); // No token provided
  }


  
}

module.exports = messageRoute;
