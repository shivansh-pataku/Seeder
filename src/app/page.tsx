"use client"
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/tasks');
  };

  return (
  <><div className='Page-Home'>

      <div className='Home-Container1'>

        <div className='Welcome'>

          <h1>Welcome to seeder</h1>
          <p style={{ fontFamily: 'var(--font-kiteone)' }}>write like a pro</p>
        </div>

        <button className='BT_continue' onClick={handleContinue}>
          Continue
        </button>

      </div>

    </div>
    
    
    
    <div className='Seeder-About'>
        <div className='intro'>
          <h2>Master AI</h2>
          <p style={{ fontFamily: 'var(--font-dmsans)' }}>
            Harness the power of Master AI to supercharge your productivity and streamline your workflow. AI guide to write your content whatever it is like blogs, articles, stories, poems, codes, etc. and finndinng limitations, suggestions, sources to refer, current advancements and background on it. And thus master your work by writing it like a pro.
          </p>
        </div>

        <div className='intro'>
          <h2>Seeder</h2>
          <p style={{ fontFamily: 'var(--font-dmsans)' }}>
            Seeder is an AI-powered text management application designed to help you organize, enhance, and optimize your written content. Whether you're a student, professional, or creative writer, Seeder provides tools to improve your writing quality and efficiency. It is purely made to curate your ideas and work in a master's way.
          </p>
        </div>

      </div></>
  )
}