# Dynamic Form Builder Documentation

## Overview
This documentation covers the integration of the frontend and backend of the Dynamic Form Builder project using oRPC and Zod.

## Features
- **User Data Validation**: Utilizes shared Zod schemas for user data validation across frontend and backend.
- **oRPC Communication**: Facilitates seamless communication between the Next.js frontend and Nest.js backend.

## Setup Instructions
### Environment Setup
1. Install Node.js and Nest.js globally if not already installed.

### Installation
1. Clone the repository.
2. Navigate to the project directory.
3. Run:
   ```bash
   npm install zod
   ```
4. Add any additional libraries, including oRPC if available.

## Testing
- **Unit Tests**: Located in `fe/tests/userSchema.test.ts` for validating shared Zod schemas.
- **Integration Tests**: Found in `fe/tests/integration.test.ts` to ensure communication between frontend/backend functions correctly.

### Documentation Updates
Ensure this documentation is updated with any feature additions or significant changes made in the project.