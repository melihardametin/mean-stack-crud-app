const e = require('express');
const express = require('express');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const { collection } = require('../models/User');
const app = express();
const userRoute = express.Router();
// User model
let User = require('../models/User');
const { ConnectableObservable } = require('rxjs');



//Get username, admin
userRoute.route('/info').get(verifyToken, (req, res) => {
  const { username, admin } = req.authData;

  res.status(200).json({
    username: username,
    admin: admin,
  });
});

// Add User
userRoute.route('/create').post((req, res, next) => {
  const { login_status } = req.query;
  const userData = req.body;
  userData.token = "x";

  if (login_status === 'true') {
    verifyToken(req, res, (err) => {
      if (err) {
        res.status(403).json({ message: 'Token verification failed' });
      } else {
        createUser();
      }
    });
  } else {
    createUser();
  }

  function createUser() {
    bcrypt.hash(userData.password, 10, (err, hashedPassword) => {
      if (err) {
        return next(err);
      }
      userData.password = hashedPassword;

      User.create(userData)
        .then((data) => {
          res.json(data);
        })
        .catch((error) => {
          return next(error);
        });
    });
  }
});



// Get Existing Usernames
userRoute.route('/get-usernames').get(verifyToken, async (req, res, next) => {
  try {
    const existingUsernames = await User.find().distinct('username');

    if (!existingUsernames || existingUsernames.length === 0) {
      return res.status(404).json({ message: 'No existing usernames found.' });
    }

    res.json(existingUsernames);
  } catch (error) {
    console.error('Error retrieving existing usernames:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Get All Users
userRoute.route('/').get(verifyToken, async (req, res, next) => {
  try {
    const { page } = req.query;
    const { sort_by} = req.query;
    const { sort_type } = req.query;
    sort_Type = parseInt(sort_type);
    const pageNumber = parseInt(page) || 1;
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / 10);

    const sortingCriteria = {};
    if (sort_by === 'username') {
      sortingCriteria.username = sort_type === '1' ? 1 : -1; 
    } else if (sort_by === 'name') {
      sortingCriteria.name = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'surname') {
      sortingCriteria.surname = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'email') {
      sortingCriteria.email = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'birthday') {
      sortingCriteria.birthday = sort_type === '1' ? 1 : -1;
    }
    else if (sort_by === 'city') {
      sortingCriteria.city = sort_type === '1' ? 1 : -1;
    }

    const Users = await User.find().sort(sortingCriteria).skip((pageNumber-1)*10).limit(10);

    res.json({
      totalUsers: totalUsers,
      totalPages: totalPages,
      currentPage: pageNumber,
      users: Users
    });
  } catch (error) {
    console.error('Error retrieving gel all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Get single user
userRoute.route('/read/:username').get(verifyToken, (req, res, next) => {
  const { username } = req.params;

  User.findOne({ username })
    .then((data) => {
      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    })
    .catch((error) => {
      return next(error);
    });
});




// Update user by username
userRoute.route('/update/:username').put(verifyToken, (req, res, next) => {
  const { username } = req.params;

  User.findOneAndUpdate({ username }, { $set: req.body })
    .then((data) => {
      res.json(data);
      console.log('Data updated successfully');
    })
    .catch((error) => {
      return next(error);
    });
});

// Delete user by username
userRoute.route('/delete/:username').delete(verifyToken, (req, res, next) => {
  const { username } = req.params;

  User.findOneAndRemove({ username })
    .then((data) => {
      res.status(200).json({ msg: data });
    })
    .catch((error) => {
      return next(error);
    });
});

userRoute.route('/logout').post((req, res, next) => {
  const { username } = req.query; // Use req.query to get URL parameters
  console.log(username);

  User.findOne({ username: username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.token = "x";
      user.save()
        .then(() => {
          res.json({ message: 'Logout successful' });
        })
        .catch((error) => {
          return next(error);
        });
    })
    .catch((error) => {
      return next(error);
    });
});


// Search for user in the database
userRoute.route('/searchUser').post((req, res, next) => {
  const { username, password } = req.body;

  // Find the user by username
  User.findOne({ username: username })
    .then((user) => {
      if (user) {
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            return next(err);
          }

          if (isMatch) {
            // Create jwt token
            const payload = { username: username, admin: user.admin };
            jwt.sign(payload, 'secretkey', {expiresIn: '2h' }, (err, token) => {
              res.setHeader('Authorization', 'Bearer ' + token); 
              user.token = token;
              user.save();
              res.status(200).json({
                admin: user.admin,
                valid: true,
                token,
                username: user.username
              });
            });
          } else {
            // Passwords do not match
            res.status(200).json({ valid: false });
          }
        });
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
        const {username, admin} = decoded;
        User.findOne({ username: username })
    .then((user) => {
      if (user) {

        if (user.username === username) {
          req.authData = { username, admin };
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


module.exports = userRoute;



