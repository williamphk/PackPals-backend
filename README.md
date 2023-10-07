# PackPals-backend

This is a RESTful API for a grocery matching application built with TypeScript, Node.js, Express, and MongoDB. This API allows users to create and manage users and matches.

## API Endpoints

The API consists of the following endpoints:

### Users
- Register: `/auth/register` (POST)
- Login with JWT: `/auth/login` (POST)
- Get refresh token: `/auth/token` (POST)
- logout: `/auth/logout` (GET)
- Get profile: `/auth/profile/:userId` (GET)

### Matches
- Create a match: `/matches` (POST)
- Retrieve newly matched products: `/matches/new` (GET)
- Retrieve ongoing matches: `/matches/ongoing` (GET)
- Retrieve recently matched products: `/matches/recent` (GET)
- Remove a specific match: `/matches/:id` (DELETE)
