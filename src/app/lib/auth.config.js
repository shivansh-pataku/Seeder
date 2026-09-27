// src/app/lib/auth.config.js
// Edge-compatible Auth.js configuration (no Node.js database or crypto C++ modules)

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isProtected = 
        pathname.startsWith('/desk') || 
        pathname.startsWith('/settings');

      const isAuthRoute = 
        pathname.startsWith('/auth/signin') || 
        pathname.startsWith('/auth/signup');

      // Unauthenticated access to protected routes -> redirect to signin
      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      // Authenticated user trying to access signin/signup -> redirect to desk
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/desk', nextUrl));
      }

      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.username = user.username;
        token.gender = user.gender || null;
        token.provider = account?.provider || 'credentials';
      }
      if (trigger === 'update' && session?.gender !== undefined) {
        token.gender = session.gender;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.username = token.username;
        session.user.gender = token.gender;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
  providers: [], // Empty providers array for Edge compatibility. Concrete providers loaded in auth.js
};
