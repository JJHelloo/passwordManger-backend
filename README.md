# passwordManger-backend Introduction
The server-side code is built using Express.js, a popular Node.js framework for building web applications and APIs. It provides routes to handle various API requests, such as user authentication, registration, password management, and more.

The code utilizes the following dependencies:

bcrypt for password hashing and comparison
mysql for interacting with the MySQL database
dotenv for loading environment variables from a .env file
cors for enabling Cross-Origin Resource Sharing (CORS)
express-rate-limit for rate limiting API requests
express-session for session management
Installation
To run the server locally, follow these steps:

Clone the repository: $ git clone <repository-url>
Install the dependencies: $ npm install
Set up the environment variables by creating a .env file in the root directory and providing the necessary values. Refer to the .env.example file for the required variables.
Set up the MySQL database and configure the connection details in the dbPool.js file.
Start the server: $ npm start
The server will start running on the specified port (default is 3001) and will be ready to accept API requests.

API Endpoints
The server provides the following API endpoints:

POST /login: Handles the login request for users. It expects the email and masterPassword in the request body. If the credentials are valid, it sets the user's session variables and returns the authenticated user details. Otherwise, it returns an error message.
POST /signup: Handles the signup request. It expects the email and masterPassword in the request body. It checks if the email is already in use and inserts the user data into the database if it's not. It returns a success message or an error if the registration fails.
POST /addPassword: Handles adding a password for the user. It expects the password, title, iv, and salt in the request body. It inserts the password data into the database associated with the user's session user_id. It returns a success message or an error if the insertion fails.
GET /showPasswords: Retrieves the stored passwords for the authenticated user. It returns the password data stored in the database associated with the user's session user_id.
GET /getUserEmail: Retrieves the email of the authenticated user. It returns the user's email associated with the user's session user_id.
POST /logout: Handles the logout request. It destroys the user's session and returns a success message.
Authentication and Session Management
The code uses the express-session middleware to manage user sessions. When a user logs in successfully, their session is authenticated by setting the req.session.authenticated variable to true and storing relevant user information such as user_id, email, and masterPassword in the session. This allows subsequent requests to identify and validate the user.

The isLoggedIn middleware function checks if the user is authenticated based on the req.session.authenticated variable. It can be used to protect certain routes that require authentication.

Database
The code interacts with a MySQL database using the mysql package. The database connection details should be configured in the dbPool.js file. Ensure that the MySQL server is running and accessible.

Rate Limiting
To prevent abuse and protect against brute force attacks, the code implements rate limiting using the express-rate-limit middleware. It limits the number of requests from a specific IP address within a specified time window. If the limit is exceeded, subsequent requests from the same IP address will receive an error response.
