# School Management System

A comprehensive school management system built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Student, teacher, and admin dashboards
- Grade management
- Assignment submission and grading
- Announcements
- Resource sharing
- And more...

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB Atlas account or local MongoDB instance

## Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd school-management-system
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Update the values in `.env` with your configuration

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Deployment to Render

1. Push your code to a GitHub repository

2. Create a new Web Service on Render and connect your GitHub repository

3. Configure the following environment variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: Generate a secure secret key
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_OPTIONS`: `--max_old_space_size=1024`

4. Set the following build settings in Render:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`

5. Deploy the application

## Environment Variables

See `.env.example` for a list of required environment variables.

## API Documentation

API documentation is available at `/api-docs` when running the application locally.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
