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
    audience: config.audience,
    scope: "submit:orders"
  });

};

window.onload = async () => {
  await configureClient();
  updateUI();
  createEventListeners();

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
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    console.log("User Authenticated");
    const userProfile = await auth0.getUser();

    // document.getElementById("ipt-access-token").innerHTML = await auth0.getTokenSilently();

    document.getElementById("ipt-user-profile").textContent = JSON.stringify(userProfile);
    document.getElementById('name-textbox').value = JSON.parse(JSON.stringify(userProfile)).name;

  } else {
    console.log("User is not Authenticated");
  }
};

//method for ID token just in case
 //await auth0.getIdTokenClaims()

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


//submit order using custom API
const submitOrderBackEnd = async (orderData) => {
  try {

    // get user id to append to api call 
    const userProfile = await auth0.getUser();
    const user_id = JSON.parse(JSON.stringify(userProfile)).sub;

    // add user id to orderData to be sent to back end
    var orderDatacopy = "";
    orderDatacopy = JSON.stringify(orderData);
    orderData.userid = user_id;

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

    // Fetch the JSON result
    if(!response.ok){
      alert("Bad Response when calling Order Submit API");
    }
    const responseData = await response;
    console.log(responseData.json());
    alert(`Order placed. Order Details: ${orderDatacopy}`);

  } catch (e) {
    // Display errors in the console
    alert(e.message);
    console.error(e);
  }

};


//update order history using auth managmenet api to add order to current_user metadata
const submitOrder = async (orderData) => {
  try {
    const differentAudienceOptions = {
    audience: 'https://dev-9r54t9mj.us.auth0.com/api/v2/',
    scope: 'openid profile email read:current_user update:current_user_metadata',
    };
    const token = await auth0.getTokenWithPopup(differentAudienceOptions);
    console.log(orderData);
   

    // call auth0 user management API
    const response = await fetch("https://dev-9r54t9mj.us.auth0.com/api/v2/users/auth0%7C620ca8160e408c006ab39806", {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
        },
        body: JSON.stringify( {"user_metadata" : orderData})
    });
    
    if(!response.ok){
      alert("Not ok reponse");
    }
    const responseData = await response.json();
    console.log(responseData);

    alert(`Order placed. Order Details: ${JSON.stringify(orderData)}`);


  } catch (e) {
    // Display errors in the console
    alert(e.message);
    console.error(e);
  }

};






function createEventListeners(){

  const form = document.getElementById('Orderform');
  form.addEventListener('submit', formSubmit);

  const orderButton = document.getElementById("btn-show-order-form");
  orderButton.addEventListener("click", showOrderForm);

  const profileButton = document.getElementById("btn-show-user-profile");
  profileButton.addEventListener("click", showProfile);

};

  showOrderForm = async () => {
    // clear other content 
   document.getElementById("profile-content").classList.add("hidden");
   document.getElementById("home-content").classList.add("hidden");
   const isAuthenticated = await auth0.isAuthenticated();
   const userProfile = await auth0.getUser();
   const isUserEmailVerified = JSON.parse(JSON.stringify(userProfile)).email_verified;
   console.log("UserEmailVerified:" + isUserEmailVerified);

   if (!isAuthenticated){
    alert("Please login to place and order");
   }else if(!isUserEmailVerified){
    alert("Please verify your email before you can place an order");
   }else{
    document.getElementById("order-content").classList.remove("hidden");
   }
};

 showProfile = async () => {
   // clear other content 
   document.getElementById("order-content").classList.add("hidden");
   document.getElementById("home-content").classList.add("hidden");
   const isAuthenticated = await auth0.isAuthenticated();
   if (isAuthenticated){
   document.getElementById("profile-content").classList.remove("hidden");
   }else{
    alert("No user account logged in");
   }
};

function formSubmit(event) {
    event.preventDefault();

    const data = new FormData(event.target);

    const value = Object.fromEntries(data.entries());

    //Submit to front end api call 
    //submitOrder(value);

    //Submit to backend 
    submitOrderBackEnd(value);

    console.log({ value })   
  };

  