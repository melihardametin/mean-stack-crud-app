const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const logRoute = express.Router();
// Log model
let Log = require('../models/Log');


// Add Log
logRoute.route('/log').post((req, res, next) => {
    Log.create(req.body)
      .then((data) => {
        res.json(data);
      })
      .catch((error) => {
        return next(error);
      });
  });


  // Get Logs
logRoute.route('/get-logs/:username').get(verifyToken, async (req, res, next) => {
  try {
    const { page } = req.query;
    const { username } = req.params;
    const { sort_by} = req.query;
    const { sort_type } = req.query;
    sort_Type = parseInt(sort_type);
    const pageNumber = parseInt(page) || 1;
    const totalLogs = await Log.countDocuments({ username: username });
    const totalPages = Math.ceil(totalLogs / 10);

    const sortingCriteria = {};
    if (sort_by === 'operation') {
      sortingCriteria.operation = sort_type === '1' ? 1 : -1; 
    } else if (sort_by === 'date') {
      sortingCriteria.date = sort_type === '1' ? 1 : -1;
    }

    const logs = await Log.find({ username: username}).sort(sortingCriteria).skip((pageNumber-1)*10).limit(10);
    res.json({
      totalLogs: totalLogs,
      totalPages: totalPages,
      currentPage: pageNumber,
      logs: logs
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

module.exports = logRoute;
