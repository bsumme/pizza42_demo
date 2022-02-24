const express = require("express");
const { auth } = require("express-oauth2-jwt-bearer");
const { join } = require("path");
const authConfig = require("./auth_config.json");
const axios = require("axios").default;
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Admin Token that will be used in Auth0 User Management API calls
let AdminToken = "";

// create the JWT middleware

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}`
});

// create Scope middleware

const { requiredScopes } = require('express-oauth2-jwt-bearer');

const checkScopes = requiredScopes('submit:orders');

var AuthenticationClient = require('auth0').AuthenticationClient;


// get access token for use with Auth0 User Management API
var auth0 = new AuthenticationClient({
domain: authConfig.domain,
  clientId: authConfig.APIclientId,
  clientSecret: authConfig.APIclientSecret,
  scope: 'read:users_app_metadata update:users_app_metadata update:users'
});

auth0.clientCredentialsGrant(
  {
    audience: authConfig.Auth0UserAPI
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



//BENAPI CALL
app.post("/api/UpdateOrderHistory", checkJwt, checkScopes, (req, res) => {


  var order = req.body;
  userid = order.userid;
  order = { "user_metadata" : order};
  //console.log(AdminToken);
  //console.log(order);
  var options = {
      method: 'PATCH',
      url: `https://${authConfig.domain}/api/v2/users/${userid}`,
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

