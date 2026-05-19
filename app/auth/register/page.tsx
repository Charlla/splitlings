import { redirect } from 'next/navigation'

// OTP-only: signup happens automatically on first /auth/login.
export default function RegisterPage() {
  redirect('/auth/login')
}
