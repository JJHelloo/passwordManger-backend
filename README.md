Password Manager Backend
This is the backend component of a password manager application built using Express.js. It provides secure user authentication and password management functionality. The backend utilizes a MySQL database to store user data securely.

Features
Zero Knowlege Service
User Authentication: Users can securely log in to access their password vault.
Password Management: Users can add, update, and retrieve their stored passwords.
Session Management: User sessions are securely managed to maintain authentication and user-specific data.
Rate Limiting: API requests are rate-limited to prevent abuse and protect against brute force attacks.
Security Measures
Session Management: User sessions are maintained securely using express-session and encrypted session cookies.
Rate Limiting: API requests are rate-limited to prevent abuse and protect against brute force attacks.
Secure Communication: It is recommended to deploy the backend server over HTTPS to ensure secure communication with the client application.

Technologies Used
Express.js: A fast and minimalist web framework for Node.js.
MySQL: A relational database management system used to store user data securely.
dotenv: A package for loading environment variables from a .env file.
cors: Enables Cross-Origin Resource Sharing (CORS) for API requests.
helmet: Adds security headers to HTTP responses.
express-rate-limit: Middleware for rate limiting API requests.
express-session: Session management middleware for Express.js.

Development
The backend code is still in development. future security enhancements are being applied along with extra feature.
