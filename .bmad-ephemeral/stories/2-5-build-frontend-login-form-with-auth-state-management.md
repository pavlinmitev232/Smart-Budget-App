# Story 2.5: Build Frontend Login Form with Auth State Management

Status: done

## Story

As a registered user,
I want a login form that manages my authenticated session,
So that I can access the application and remain logged in.

## Acceptance Criteria

**AC1:** Given I navigate to the login page (`/login`), when I submit my credentials, then the application authenticates me and manages my session state

**AC2:** The login form:
- Has email and password inputs
- Has "Remember me" checkbox (optional)
- Has submit button
- Shows loading state during authentication
- Displays error messages for failed login

**AC3:** Successful login:
- Stores JWT token in localStorage or sessionStorage
- Updates global auth state (React Context or state management)
- Redirects to dashboard (`/dashboard`)
- Includes Authorization header in future API requests

**AC4:** The app includes AuthContext provider:
- Provides `user` object (id, email)
- Provides `isAuthenticated` boolean
- Provides `login(token, user)` function
- Provides `logout()` function
- Checks for existing token on app load

**AC5:** Axios or fetch is configured to include token in headers:
```javascript
headers: { 'Authorization': `Bearer ${token}` }
```

**AC6:** Expired token triggers logout and redirect to login

## Tasks / Subtasks

- [ ] **Task 1: Create Login Page Component** (AC: #1, #2)
  - [ ] Create `src/pages/Login.tsx` or `src/components/Auth/Login.tsx`
  - [ ] Set up form structure (email, password, submit button)
  - [ ] Add route for /login in React Router
  - [ ] Style with Tailwind CSS
  - [ ] Add "Remember me" checkbox (optional)
  - [ ] Test login page renders correctly

- [ ] **Task 2: Implement Login Form with React Hook Form** (AC: #2)
  - [ ] Initialize useForm hook
  - [ ] Register email and password fields
  - [ ] Set validation rules (required fields)
  - [ ] Handle form submission
  - [ ] Test form validation works

- [ ] **Task 3: Create AuthContext** (AC: #4)
  - [ ] Create `src/context/AuthContext.tsx`
  - [ ] Define AuthContext with user, isAuthenticated, login, logout
  - [ ] Create AuthProvider component with state management
  - [ ] Provide context value to app
  - [ ] Wrap App component with AuthProvider
  - [ ] Test context provides correct values

- [ ] **Task 4: Implement Login Function in AuthContext** (AC: #3, #4)
  - [ ] Create login function that accepts token and user
  - [ ] Store token in localStorage or sessionStorage
  - [ ] Update user state with user object
  - [ ] Set isAuthenticated to true
  - [ ] Store user object in context state
  - [ ] Test login updates state correctly

- [ ] **Task 5: Implement Logout Function in AuthContext** (AC: #4)
  - [ ] Create logout function
  - [ ] Clear token from storage (localStorage.removeItem('token'))
  - [ ] Set user to null
  - [ ] Set isAuthenticated to false
  - [ ] Redirect to /login page
  - [ ] Test logout clears state correctly

- [ ] **Task 6: Check for Existing Token on App Load** (AC: #4)
  - [ ] In AuthProvider useEffect, check localStorage for token
  - [ ] If token exists, validate with backend (/api/auth/me)
  - [ ] If valid, restore user session
  - [ ] If invalid/expired, clear token and logout
  - [ ] Test app restores session after page refresh

- [ ] **Task 7: Implement API Login Request** (AC: #1, #3)
  - [ ] POST credentials to /api/auth/login
  - [ ] Handle loading state during request
  - [ ] On success: call AuthContext login() with token and user
  - [ ] On error: display error message
  - [ ] Test API request sends correct data

- [ ] **Task 8: Configure Axios to Include Token** (AC: #5)
  - [ ] Create axios request interceptor
  - [ ] Read token from localStorage
  - [ ] Add Authorization header: `Bearer ${token}`
  - [ ] Apply interceptor to axios instance
  - [ ] Test future requests include token header

- [ ] **Task 9: Handle Token Expiration** (AC: #6)
  - [ ] Create axios response interceptor
  - [ ] Catch 401 Unauthorized responses
  - [ ] Call logout() on 401 (token expired or invalid)
  - [ ] Redirect to /login page
  - [ ] Show message: "Session expired. Please log in again."
  - [ ] Test 401 response triggers logout

- [ ] **Task 10: Handle Login Success** (AC: #3)
  - [ ] Store JWT token in localStorage
  - [ ] Update AuthContext with user data
  - [ ] Redirect to /dashboard using React Router
  - [ ] Clear form after successful login
  - [ ] Test redirect works correctly

- [ ] **Task 11: Handle Login Errors** (AC: #2)
  - [ ] Display invalid credentials error (401)
  - [ ] Display server error messages (500)
  - [ ] Show error above login form
  - [ ] Clear error when user modifies input
  - [ ] Test error messages display correctly

- [ ] **Task 12: Add Loading State** (AC: #2)
  - [ ] Show loading spinner on submit button
  - [ ] Disable form during submission
  - [ ] Change button text to "Logging in..."
  - [ ] Re-enable form if login fails
  - [ ] Test loading state appears/disappears

- [ ] **Task 13: Styling and UX** (AC: #2)
  - [ ] Style form with Tailwind CSS
  - [ ] Add responsive design for mobile
  - [ ] Style submit button with hover states
  - [ ] Add link to registration page
  - [ ] Add "Forgot password?" link (placeholder for future)
  - [ ] Test form looks good on different screen sizes

- [ ] **Task 14: Testing and Validation** (AC: #1-6)
  - [ ] Test successful login stores token and redirects
  - [ ] Test invalid credentials show error
  - [ ] Test token persists after page refresh
  - [ ] Test logout clears token and state
  - [ ] Test axios includes token in future requests
  - [ ] Test 401 response triggers logout
  - [ ] Test loading state during submission
  - [ ] Test form validation prevents empty submission
  - [ ] Test keyboard navigation and accessibility

## Dev Notes

### Architecture Alignment

**Frontend Architecture (from Architecture Document):**
- **State Management:** React Context API
- **Token Storage:** localStorage (persistent) or sessionStorage (temporary)
- **HTTP Client:** Axios with interceptors
- **Routing:** React Router v7.9.5
- **Form Handling:** React Hook Form v7.66.0

**Authentication Flow:**
1. User submits login form
2. POST to /api/auth/login
3. Receive JWT token and user data
4. Store token in localStorage
5. Update AuthContext state
6. Redirect to dashboard
7. Future requests include token in Authorization header

**Token Management:**
- Store in localStorage for persistence
- Include in Authorization header for all authenticated requests
- Validate token on app load
- Clear token on logout or 401 response

### Learnings from Previous Stories

**From Story 2.2: User Login API (Status: drafted)**

- **API Endpoint:**
  - POST /api/auth/login
  - Request: `{ email, password }`
  - Success Response (200): `{ success: true, data: { token: "<JWT>", user: { id, email } } }`
  - Error Response (401): "Invalid email or password"

- **JWT Token:**
  - Contains: `{ userId, email }`
  - Expires in 24 hours
  - Must be included in Authorization header for protected routes

- **Recommendations:**
  - Store token securely in localStorage
  - Include token in all authenticated requests
  - Handle token expiration gracefully

[Source: stories/2-2-implement-user-login-api-with-jwt-token-generation.md]

**From Story 2.3: Authentication Middleware (Status: drafted)**

- **Protected Routes:**
  - Require Authorization: Bearer <token> header
  - Return 401 if token missing/invalid/expired
  - /api/auth/me endpoint validates current user

- **Recommendations:**
  - Use /auth/me to validate existing token on app load
  - Handle 401 responses by clearing token and redirecting to login
  - Set up axios interceptors for automatic token inclusion

[Source: stories/2-3-create-authentication-middleware-for-protected-routes.md]

**From Story 2.4: Frontend Registration Form (Status: drafted)**

- **Frontend Setup:**
  - React Router configured
  - Axios instance created
  - Form components styled with Tailwind
  - React Hook Form for form handling

- **Recommendations:**
  - Reuse axios instance from registration
  - Follow similar form structure and styling
  - Add link from login to registration page

[Source: stories/2-4-build-frontend-registration-form-and-flow.md]

### Project Structure Notes

**New Files:**
```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state management
│   ├── pages/
│   │   └── Login.tsx            # Login page component
│   └── hooks/
│       └── useAuth.ts           # (Optional) Custom hook for auth context
```

**Modified Files:**
```
frontend/
├── src/
│   ├── App.tsx                  # Add /login route, wrap with AuthProvider
│   └── services/
│       └── api.ts               # Add axios interceptors
```

### Technical Constraints

**Prerequisites:**
- Story 2.2 completed (login API exists)
- Story 2.3 completed (auth middleware exists)
- Story 2.4 completed (React Router and axios configured)

**AuthContext Implementation:**
```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: { id: number; email: string } | null;
  isAuthenticated: boolean;
  login: (token: string, user: { id: number; email: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token with /api/auth/me
      validateToken(token);
    }
  }, []);

  const login = (token: string, userData: { id: number; email: string }) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Axios Interceptors:**
```typescript
// Request interceptor - add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Login Form Implementation:**
```typescript
const onSubmit = async (data: { email: string; password: string }) => {
  try {
    setIsLoading(true);
    const response = await axios.post('/api/auth/login', data);
    const { token, user } = response.data.data;
    login(token, user);
    navigate('/dashboard');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      setError(error.response?.data?.error?.message || 'Login failed');
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Testing Standards

- Test successful login stores token and redirects
- Test invalid credentials display error message
- Test token persists across page refreshes
- Test logout clears token and state
- Test axios includes token in requests
- Test 401 response triggers logout
- Test loading state during submission
- Test form validation prevents empty fields
- Test AuthContext provides correct values
- Test keyboard navigation and accessibility

### UX Considerations

**Success Flow:**
- Smooth redirect to dashboard
- No flash of unauthenticated state
- Welcome message (optional)

**Error Handling:**
- Clear error messages
- Errors displayed above form
- Errors clear when user modifies input

**Session Persistence:**
- Token stored in localStorage (persistent across tabs/windows)
- User remains logged in after page refresh
- Token validated on app load

**Loading States:**
- Button shows spinner during authentication
- Form disabled during submission
- Clear visual feedback

### References

- [Source: docs/epics.md#Story-2.5-Build-Frontend-Login-Form]
- [Source: docs/architecture.md#State-Management-React-Context-API]
- [Source: docs/architecture.md#HTTP-Client-Axios]
- [Source: stories/2-2-implement-user-login-api-with-jwt-token-generation.md]
- [Source: stories/2-3-create-authentication-middleware-for-protected-routes.md]
- [Source: stories/2-4-build-frontend-registration-form-and-flow.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-11-14: Story drafted by SM agent (Bob) from epics.md, architecture.md, and PRD.md
