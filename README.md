# PackPals-backend

This is a RESTful API for a grocery matching application built with TypeScript, Node.js, Express, and MongoDB. This API allows users to create and manage users and matches.

## API Endpoints

The API consists of the following endpoints:

### Auth
- Register: `/auth/register` (POST)
- Login with JWT: `/auth/login` (POST)
- Retrieve refresh token: `/auth/token` (POST)
- Logout: `/auth/logout` (GET)
- Remove profile: `/auth/profile/:userId` (DELETE)

### Matches
- Search for matches: `/matches/:keyword` (GET)
- Retrieve specific match: `/matches/:matchId` (GET)
- Create a match: `/matches` (POST)
- Accept match `/matches/:matchId/accept` (POST)
- Remove a specific match: `/matches/:matchId` (DELETE)

### Users
- Retrieve recently matched products: `/users/:userId/recent` (GET)
- Retrieve ongoing matches: `/users/:userId/ongoing` (GET)
- Retrieve you might like matches: `/users/:userId/like` (GET)

### Notifications
- Retrieve all unread notifications: `/notifications` (GET)
- Read all notifications: `/notifications` (PUT)

### Socket.io
- Create a private room for each user
- Send a notification to the user whose matches are being accepted

## Built With

- [Node.js](https://nodejs.org/en) - JavaScript runtime
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Socket.io](https://socket.io/) - Realtime Communication channel
