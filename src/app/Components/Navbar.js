'use client'
import styles from '../Styles/Navbar.module.css';
import ThemeToggle from './Button-ThemeToggle'
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react'
import Link from "next/link";
//This is Pages Router syntax
// import Router, { useRouter } from 'next/router'
//App Router syntax
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
    // const { data: session, status } = useSession()

  const [showMenu, setShowMenu] = useState(false); //useState helps to hide/show menu
  const handleMenuToggle = () => setShowMenu(prev => !prev);
  const router = useRouter()

      const handleLogout = () => {
        signOut({ callbackUrl: '/' })
        setShowMenu(false)
      }

      const handleProfile = () => {
        setShowMenu(false)
        if(!session) // session is recieved from 
        {
         router.push('/auth/signin')
        }else{
          router.push(`/${session.user.username}`) //username is from database (in profile table)
        }
      }
      const handleSettings = () => {
        setShowMenu(false)
        if(session)
        {
          router.push('/settings')
        }else{
          router.push('/auth/signin')
        }
      }

      // Show loading state - not needed for now
      // if (status === 'loading') {
      //   return <nav className={styles.navbar}>Loading...</nav>
      // }

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.title} onClick={() => router.push('/')}>Seeder</h1>
      <div className={styles.links}>
        <ThemeToggle />
        <Link href='/about' className={styles.link}>About</Link>
        {session?.user ? (
          <div style={{ position: "relative" }}>
            <div onClick={handleMenuToggle} className={styles.username}>
              {"u/" + (session.user.username || session.user.name)}
            </div>
            {showMenu && (
              <div className={styles.menu}>
                <div className={styles.menuLink} onClick={handleProfile}>  Profile</div>
                <div className={styles.menuLink} onClick={handleSettings}> Settings</div>
                <div className={styles.menuLink} onClick={handleLogout}>   Logout</div>
              </div>
            )}
          </div>
        ) : (
          <Link href='/auth/signin' className={styles.logsig}>Login or Signup</Link>
        )}
      </div>
      <div className={styles.loadingbar}></div>
    </nav>
  );
}


//////////////////////////////////////////////////////////////////////////////////////////////////

// //1. session in navbar comes form :Line 5 in Navbar.js

// //form :Line 5 in Navbar.js
// import { useSession, signOut } from 'next-auth/react'
// //form :Line 13 in Navbar.js
  
// const { data: session, status } = useSession()
// //^^^^^^^ This is where session comes from

// //2. Session Provider Setup (Root Level) which allows children having session data
// import { SessionProvider } from 'next-auth/react'

// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         <SessionProvider>  {/* ← Session context starts here */}
//           {children}
//         </SessionProvider>
//       </body>
//     </html>
//   )
// }

// //3. In  Navbar.js
// const { data: session, status } = useSession()
// //     ↑              ↑
// //     │              └── 'loading' | 'authenticated' | 'unauthenticated'
// //     └── User session data or null


// //4. When user is logged in:
// session = {
//   user: {
//     id: '1',
//     email: 'test@test.com', 
//     name: 'Test User',
//     username: 'testuser'  // if available
//   },
//   expires: '2024-12-09T...'
// }

// // When user is not logged in:
// session = null