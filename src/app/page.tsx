"use client"
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/tasks');
  };

  return (
  <div className='Page-Home'>

    <div className='Home-Container1'>

      <div className='Welcome'>

      <h1>Welcome to seeder</h1>
        <p style={{ fontFamily: 'var(--font-kiteone)' }}>Think like a pro.</p>
      </div>

      <button className='BT_continue' onClick={handleContinue}>
        Continue
      </button>

    </div>

  </div>
  )
}