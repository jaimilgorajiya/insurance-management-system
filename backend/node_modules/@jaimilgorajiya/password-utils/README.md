# @jaimilgorajiya/password-utils

A robust, production-ready Node.js library for secure password management. Features bcrypt hashing, strength validation, comparison helpers, and login rate limiting.

## Features

- 🔒 **Secure Hashing**: Uses `bcryptjs` for industry-standard password hashing.
- ✅ **Validation**: Custom rule-based password strength checking.
- ⚡ **Rate Limiting**: Built-in login attempt limiter to prevent brute-force attacks.
- 📦 **Dual Support**: Works seamlessly with both CommonJS (`require`) and ES Modules (`import`).
- 🔷 **TypeScript**: Includes full type definitions (`.d.ts`).

## Installation

```bash
npm install @jaimilgorajiya/password-utils
```

## Usage

### 1. Import the library

**ES Modules (import)**
```javascript
import { 
  validatePassword, 
  hashPassword, 
  comparePassword, 
  loginRateLimiter 
} from '@jaimilgorajiya/password-utils';
```

**CommonJS (require)**
```javascript
const { 
  validatePassword, 
  hashPassword, 
  comparePassword, 
  loginRateLimiter 
} = require('@jaimilgorajiya/password-utils');
```

---

### 2. Complete Registration & Login Flow

Here is how you would use `password-utils` in a deeper real-world context like an Express.js controller.

#### **User Registration (Sign Up)**

```javascript
/* REGISTER CONTROLLER */
const registerUser = async (req, res) => {
  const { username, password } = req.body;

  // 1. Validate Password Strength
  const validation = validatePassword(password);
  if (!validation.isValid) {
    return res.status(400).json({ 
      message: 'Weak password', 
      errors: validation.errors 
    });
  }

  try {
    // 2. Hash Password securely
    const hashedPassword = await hashPassword(password);

    // 3. Save User to Database (Mock)
    // await db.users.create({ username, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

#### **User Login (Sign In)**

```javascript
/* LOGIN CONTROLLER */
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Check Rate Limit (Prevent Brute Force)
  // Identify by IP address or Username
  const attempt = loginRateLimiter(req.ip, 5, 60 * 1000); // 5 attempts per 60s
  
  if (!attempt.allowed) {
    return res.status(429).json({ message: attempt.message });
  }

  // Fetch user from DB
  const user = await db.users.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // 2. Compare Password
  const isMatch = await comparePassword(password, user.password);
  
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful', token: 'abcd-1234' });
};
```

---

## API Reference

| Function | Params | Returns | Description |
|----------|-----------|---------|-------------|
| `validatePassword` | `(password)` | `{ isValid, errors }` | Validates password complexity. |
| `hashPassword` | `(password, salt=10)` | `Promise<string>` | Hashes a password (bcrypt). |
| `comparePassword` | `(plain, hashed)` | `Promise<boolean>` | Verifies password match. |
| `loginRateLimiter` | `(id, max=5, win=60k)` | `{ allowed, msg }` | In-memory rate limiter. |

## Development & Maintenance

### Running Tests
This project uses **Jest** for testing.
```bash
npm test
```

### Publishing a New Version
1. **Update Version**: Bump the version in `package.json`.
   ```bash
   npm version patch  # or minor/major
   ```
2. **Run Tests**: Ensure everything is stable.
   ```bash
   npm test
   ```
3. **Publish**: Push to npm registry.
   ```bash
   npm publish
   ```

## License

MIT © Jaimil Gorajiya
