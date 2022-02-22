//app.js
let auth0 = null;
let auth_user = null;


const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience
  });

  auth_user = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: "https://dev-9r54t9mj.us.auth0.com/api/v2/",
    scope: "openid profile email read:current_user update:current_user_metadata"
  });
};



window.onload = async () => {
  await configureClient();
  updateUI();
  createEventListener();

 const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
};


const updateUI = async () => { 
  const isAuthenticated = await auth0.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;

  // NEW - enable the button to call the API
  document.getElementById("btn-call-api").disabled = !isAuthenticated;
  document.getElementById("btn-call-user-api").disabled = !isAuthenticated;
  //document.getElementById("btn-call-get-admin-token").disabled = !isAuthenticated;
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = await auth0.getTokenSilently();

    document.getElementById("ipt-user-profile").textContent = JSON.stringify(
      await auth0.getUserinfo
    );

  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};


const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin
  });
};

const logout = () => {
  auth0.logout({
    returnTo: window.location.origin
  });
};

const callApi = async () => {
  try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    // Make the call to the API, setting the token
    // in the Authorization header
    const response = await fetch("/api/external", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-call-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);

} catch (e) {
    // Display errors in the console
    console.error(e);
  }
};


//submit order using custom API
const SubmitOrderBackEnd = async (orderData) => {
  try {

    alert(orderData);
    orderData = { "user_metadata" : orderData};

    try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    const response = await fetch("/api/UpdateOrderHistory", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "application/json; charset=UTF-8" 
        },
      body: JSON.stringify(orderData)
    })
    // .then(response => response.json())
    // .then(json => console.log(json));

    // Fetch the JSON result
    const responseData = await response;
    const responseJson = await responseData.json();
    console.log(responseJson);


    } catch (e) {
        // Display errors in the console
        console.error(e);
      }

  } catch (e) {
    // Display errors in the console
    alert(e.message);
    console.error(e);
  }

};


//update order history using auth managmenet api to add order to current_user metadata
const SubmitOrder = async (orderData) => {
  try {

    // append user_metadata parent JSON field
    orderData = { "user_metadata" : orderData};
    console.log(orderData);
    // Get the access token from the Auth0 client
   const token = await auth_user.getTokenWithPopup();
   

    // call auth0 user management API
    const response = await fetch("https://dev-9r54t9mj.us.auth0.com/api/v2/users/auth0%7C620ca8160e408c006ab39806", {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    });
    
    if(!response.ok){
      alert("Not ok reponse");
    }
    const responseData = await response.json();
    console.log(responseData);

    const response2 = await fetch("https://dev-9r54t9mj.us.auth0.com/api/v2/users/auth0%7C620ca8160e408c006ab39806", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if(!response2.ok){
      alert("Not ok reponse");
    }
    const responseData2 = await response2.json();
    console.log(responseData2);


  } catch (e) {
    // Display errors in the console
    alert(e.message);
    console.error(e);
  }

};



function handleSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);

    const value = Object.fromEntries(data.entries());

    //Submit to front end api call 
    //SubmitOrder(value);

    //Submit to backend 
    SubmitOrderBackEnd(value);

    //console.log({ value });
  };


function createEventListener(){

  const form = document.querySelector('#form');
  form.addEventListener('submit', handleSubmit);
};