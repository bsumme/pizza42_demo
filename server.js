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
//test token from API Test Explorer
let TestAdminToken="PASTE_TEST_TOKEN_HERE"

// create the JWT middleware

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`
});

var AuthenticationClient = require('auth0').AuthenticationClient;

var auth0 = new AuthenticationClient({
domain: 'dev-9r54t9mj.us.auth0.com',
  clientId: 'eobn8NS1cGR1rnQH2CyJbklfObOZm6bz',
  clientSecret: 'U_U-oPp8UGGEsQN8K2bDe6FZRH2BXxXDDo3J1GRQpn2vdxD5T6ijeeuEJnhNwKcN',
  scope: 'update:current_user_metadata'
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
      //console.log(response.access_token);
  }
  }
);



app.post("/api/UpdateOrderHistory", checkJwt, (req, res) => {


  var order = req.body;
  //console.log(AdminToken);
  var options = {
      method: 'PATCH',
      url: 'https://dev-9r54t9mj.us.auth0.com/api/v2/users/auth0%7C620ca8160e408c006ab39806',
        headers: {authorization: `Bearer ${TestAdminToken}`, 'content-type': 'application/json'},
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


app.get("/api/getAdminToken", (req, res) => {
  var options = {
    method: 'POST',
    url: 'https://dev-9r54t9mj.us.auth0.com/oauth/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: '{"client_id":"yAvctZfZbm2WuKW9WuQQwAdGCp7gSNZk","client_secret":"cX7R_phG5QZ3_4jfvLusmcdXXWEUmi6-g6nYQZbF0W4mEwif7nVjeRJN_8ISWULg","audience":"https://dev-9r54t9mj.us.auth0.com/api/v2/","grant_type":"client_credentials"}'
    };


    axios.request(options).then(function (response) {
      console.log(response.data);
      res.send({
        msg: "Admin token data: " + response.data
      });
    }).catch(function (error) {
      console.error(error);
    });


});







//Create an endpoint that uses the above middleware to
//protect this route from unauthorized requests
app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
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

