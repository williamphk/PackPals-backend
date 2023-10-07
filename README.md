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
- Accept match `/matches/:matchId/accept` (POST)
- Create a match: `/matches` (POST)
- Remove a specific match: `/matches/:matchId` (DELETE)

## Users
- Retrieve recently matched products: `/users/recent` (GET)
- Retrieve ongoing matches: `/users/ongoing` (GET)
- Retrieve you might like matches: `/users/like` (GET)

