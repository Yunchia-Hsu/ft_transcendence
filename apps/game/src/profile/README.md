# Profile Module

This folder contains all profile-related components and functionality.

## Structure

- `Profile.tsx` - Main profile component for viewing and editing user profile
- `index.ts` - Barrel export for clean imports

## Features

- User profile viewing and editing
- Display name management
- Avatar URL management
- Username editing
- Internationalization support (EN/RU/ZH)
- Integration with auth store for profile updates

## Usage

```tsx
import { Profile } from './profile';

// Use in routes
<Route path="/profile" element={<Profile />} />
```

## Future Extensions

This folder can be extended with additional profile-related components such as:
- Profile settings
- Privacy settings
- Notification preferences
- Account security settings
- Profile picture upload component
