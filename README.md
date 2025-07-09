# SeatnDine 🍽️

A mobile application for restaurant reservations, built with [Expo](https://expo.dev) and React Native.

## Description

SeatnDine is an application that allows users to:
- Search for nearby restaurants
- Make table reservations
- View menus and reviews
- Manage existing reservations
- Receive personalized recommendations

## Prerequisites

Before you begin, make sure you have installed:

- [Node.js](https://nodejs.org/) (version 16 or newer)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Expo Go](https://expo.dev/go) on your mobile device

### Installing Expo Go

1. **For Android**: Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. **For iOS**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SeatnDine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the application

1. Start the app in development mode:
   ```bash
   npx expo start
   ```

2. After the server starts, you'll see a QR code in the terminal.

3. **To open the app on your phone:**
   - Open the **Expo Go** app on your phone
   - Scan the QR code displayed in the terminal
   - The app will load automatically on your device

4. **To open in emulator/simulator:**
   - Press `a` in the terminal for Android emulator
   - Press `i` in the terminal for iOS simulator

## Project Structure

```
SeatnDine/
├── app/                    # App pages (file-based routing)
├── components/             # Reusable components
├── contexts/              # React contexts for state management
├── services/              # Services for API calls
├── types/                 # TypeScript definitions
└── assets/                # Images, fonts and other resources
```

## Technologies Used

- [Expo](https://expo.dev/) - Development platform
- [React Native](https://reactnative.dev/) - Main framework
- [TypeScript](https://www.typescriptlang.org/) - Static typing
- [Supabase](https://supabase.com/) - Backend and database
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based navigation

## Development

To contribute to the project:

1. Create a new branch for your feature
2. Make the necessary changes
3. Test the app with `npx expo start`
4. Create a pull request

## Support

If you encounter issues or have questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Create an issue in the repository
- Contact the development team

## License

Copyright (c) 2025 Kish Andrei Cezar. All rights reserved.

This software and associated documentation files (the "Software") are the exclusive property of Kish Andrei Cezar. No part of this Software may be reproduced, distributed, transmitted, displayed, published, or broadcast without the prior written permission of the copyright holder.

**NO PERMISSION IS GRANTED** to any person to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software without explicit written consent from Kish Andrei Cezar.

Any unauthorized use, reproduction, or distribution of this Software is strictly prohibited and may result in legal action.

For licensing inquiries, please contact: Kish Andrei Cezar