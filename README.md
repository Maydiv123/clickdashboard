# Click App Admin Dashboard

This is the admin dashboard for the Click App, providing administration and management tools for users, petrol pumps, teams, and application settings.

## Features

- **User Management**: View, block, and delete users
- **Petrol Pump Management**: Verify, view details, and manage petrol pumps
- **Team Management**: View team details and members
- **Application Settings**: Configure app-wide settings

## Tech Stack

- React.js with Vite
- Firebase (Authentication, Firestore)
- Material UI
- React Router
- Recharts for data visualization

## Getting Started

### Prerequisites

- Node.js and npm installed
- Firebase project with the same configuration as the Click App

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Firebase Configuration

The admin dashboard connects to the same Firebase project as the Click App mobile application. The configuration is stored in `src/firebase/config.js`.

## Admin Access

By default, all users cannot access the admin dashboard. You need to:

1. Create a user in the Click App
2. Use Firebase Console to assign admin role to the user
3. Log in with the admin credentials

## Deployment

To build for production:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is proprietary and not licensed for public use.

## Contact

For support, please email support@clickapp.com
