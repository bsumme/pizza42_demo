const express = require("express");
const { auth } = require("express-oauth2-jwt-bearer");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const axios = require("axios").default;
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let AdminToken = "";
// create the JWT middleware

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`
});

const { requiredScopes } = require('express-oauth2-jwt-bearer');

const checkScopes = requiredScopes('submit:orders');

var AuthenticationClient = require('auth0').AuthenticationClient;


// get access token for use with Auth0 User Management API
var auth0 = new AuthenticationClient({
domain: 'dev-9r54t9mj.us.auth0.com',
  clientId: 'eobn8NS1cGR1rnQH2CyJbklfObOZm6bz',
  clientSecret: '<CLIENT_SECRET>',
  scope: 'read:users_app_metadata update:users_app_metadata update:users'
});

auth0.clientCredentialsGrant(
  {
    audience: 'https://dev-9r54t9mj.us.auth0.com/api/v2/'
  },
  function (err, response) {
    if (err) {
      console.log(err);
    }else{
      AdminToken = response.access_token;
      console.log(response.access_token);
    }
  }
);

// var options = {
//     method: 'POST',
//     url: 'https://dev-9r54t9mj.us.auth0.com/oauth/token',
//     headers: { 'content-type': 'application/x-www-form-urlencoded' },
//     body: '{"client_id":"eobn8NS1cGR1rnQH2CyJbklfObOZm6bz","client_secret":"U_U-oPp8UGGEsQN8K2bDe6FZRH2BXxXDDo3J1GRQpn2vdxD5T6ijeeuEJnhNwKcN","audience":"https://dev-9r54t9mj.us.auth0.com/api/v2/","grant_type":"client_credentials","scope": "read:users_app_metadata update:users_app_metadata"}'
//     };


//     axios.request(options).then(function (response) {
//       console.log(response.data);
//       res.send({
//         msg: "Admin token data: " + response.data
//       });
//     }).catch(function (error) {
//       //console.error(error);
//     });


app.post("/api/UpdateOrderHistory", checkJwt, checkScopes, (req, res) => {


  var order = req.body;
  userid = order.userid;
  console.log(userid);
  order = { "user_metadata" : order};
  console.log(AdminToken);
  //console.log(order);
  var options = {
      method: 'PATCH',
      url: `https://dev-9r54t9mj.us.auth0.com/api/v2/users/${userid}`,
        headers: {authorization: `Bearer ${AdminToken}`, 'content-type': 'application/json'},
            data: order
    };

    axios.request(options).then(function (response) {
      console.log(response.data);
      res.send({
        msg: response.data
      });
    }).catch(function (error) {
      console.error(error);
    });
});




// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// pizza test page
app.get("/pizza", (_, res) => {
  res.sendFile(join(__dirname, "pizza.html"));
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});



//Error Handler
app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

module.exports = app;

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Application running on port " + port))

