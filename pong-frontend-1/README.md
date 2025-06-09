# Pong Frontend

This project is a simple Pong browser game frontend built with React and TypeScript. It includes an authentication system, a main page as a blank placeholder for the game, and a menu with options for logout, language selection, and dark/light theme selection.

## Project Structure

```
pong-frontend
├── public
│   └── index.html          # Main HTML file
├── src
│   ├── App.css            # Styles for the main App component
│   ├── App.tsx             # Main component with routing
│   ├── index.css          # Global styles
│   ├── index.tsx          # Entry point for the React application
│   ├── components          # Contains all React components
│   │   ├── Auth           # Authentication components
│   │   │   └── AuthForm.tsx
│   │   ├── Game           # Game components
│   │   │   └── GamePlaceholder.tsx
│   │   └── Menu           # Menu components
│   │       ├── Menu.tsx
│   │       ├── LanguageSelector.tsx
│   │       └── ThemeToggler.tsx
│   ├── contexts           # Contexts for state management
│   │   ├── AuthContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks              # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useSettings.ts
│   ├── pages              # Page components
│   │   ├── LoginPage.tsx
│   │   └── MainPage.tsx
│   ├── services           # Services for API calls
│   │   └── authService.ts
│   ├── types              # TypeScript types and interfaces
│   │   └── index.ts
│   └── react-app-env.d.ts # TypeScript definitions for React app environment
├── package.json           # npm configuration file
├── tsconfig.json          # TypeScript configuration file
└── README.md              # Project documentation
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd pong-frontend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

## Features

- User authentication with login/logout functionality.
- Main page with a placeholder for the Pong game.
- Menu with options for:
  - Logout
  - Language selection
  - Dark/light theme selection

## Technologies Used

- React
- TypeScript
- CSS
- Context API for state management

## License

This project is licensed under the MIT License.