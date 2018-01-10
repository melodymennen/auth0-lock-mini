const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const axios = require('axios');

require('dotenv').config();
massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

const app = express();
app.use(bodyPaser.json());
app.use(session({
  secret: "mega hyper ultra secret",
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(`${__dirname}/../build`));

app.post('/login', (req, res) => {
  const { userId } = req.body;
  console.log(userId)
  const auth0url = `https://${process.env.REACT_APP_AUTH0_DOMAIN}/api/v2/users/${userId}`;

  axios.get(auth0url, { headers: { Authorization: 'Bearer ' + process.env.AUTH0_MANAGEMENT_ACCESS_TOKEN } }).then(response => {
    app.get('db').find_user_by_auth0_id([response.data.user_id]).then(users => {
      if (users.length){
        req.session.user = users[0];
        res.json({ user: req.session.user });
      } else {
        app.get('db').create_user([response.data.user_id, response.data.email]).then(newUsers => {
          req.session.user = newUsers;
          res.json({ user: req.session.user });
        })
      }
    })
  }).catch(error => {
    console.log(error)
    res.status(500).json({ message: 'oh no' })
  })
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send();
});

app.get('/user-data', (req, res) => {
  res.json({ user: req.session.user });
});

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
}

app.get('/secure-data', checkLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
