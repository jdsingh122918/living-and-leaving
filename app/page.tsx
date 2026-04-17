import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { getDefaultRoute, UserRole } from '@/lib/auth/roles'
import { UserRepository } from '@/lib/db/repositories/user.repository'

const userRepository = new UserRepository()

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()

  if (userId) {
    // Prefer the DB role over the Clerk JWT claim. JWT claims are cached for
    // the duration of the session, so after an admin changes someone's role
    // they'd still land on the old dashboard until re-login. Reading from DB
    // makes role changes take effect on the next request.
    const dbUser = await userRepository.getUserByClerkId(userId)
    const dbRole = dbUser?.role as UserRole | undefined
    const claimRole = (sessionClaims?.metadata as { role?: string })?.role as
      | UserRole
      | undefined
    const userRole = dbRole ?? claimRole

    if (userRole) {
      const defaultRoute = getDefaultRoute(userRole)
      redirect(defaultRoute)
    }
  }

  // If user is not authenticated, redirect to sign-in (or test login in test mode)
  if (process.env.INTEGRATION_TEST_MODE === 'true') {
    redirect('/api/auth/test-login')
  }
  redirect('/sign-in')
}
