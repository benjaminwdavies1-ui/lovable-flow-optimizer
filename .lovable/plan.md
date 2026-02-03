
# Remove Sign Up Page

A simple change to remove the sign up functionality from the auth page, leaving only the login form.

---

## Changes Required

### 1. Simplify Auth Page
**File:** `src/pages/Auth.tsx`

- Remove the `useState` for `isLogin` toggle (no longer needed)
- Remove the `SignupForm` import
- Remove the conditional rendering between Login/Signup
- Update the card header to show only login messaging
- Render only the `LoginForm` component

### 2. Update Login Form
**File:** `src/components/auth/LoginForm.tsx`

- Remove the `onToggle` prop (no longer needed)
- Remove the "Don't have an account? Sign up" link at the bottom

### 3. Delete Sign Up Form (Optional)
**File:** `src/components/auth/SignupForm.tsx`

- This file can be deleted since it's no longer used
- Or keep it for potential future use

---

## Result

The auth page will display only the login form with:
- Email input
- Password input
- Sign in button
- Clean, focused UI without sign up options
