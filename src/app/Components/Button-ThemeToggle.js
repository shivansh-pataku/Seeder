'use client'
import styles from '../Styles/Navbar.module.css' // imports styles from a CSS module file named Button-ThemeToggle.module.css, which is used to style the button component.
import { useTheme } from './ThemeProvider' // imports a custom hook useTheme from the ThemeContext file, which is used to access the current theme and a function to toggle the theme between light and dark modes. This hook is used to get the current theme and toggleTheme function, which are then used in the ThemeToggle component to switch between themes when the button is clicked.

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme() //value returned by useTheme is an object with theme and toggleTheme properties, which are destructured; const { theme, toggleTheme } = theme keyword is used to destructure the object returned by useTheme hook, and deyword toggleTheme is a function that toggles the theme between light and dark modes. means the value theme will be passed to ThemeToggle component, and toggleTheme is a function that will be called when the button is clicked to switch the theme. and this function will activate when the button is clicked

  return (
    <button onClick={toggleTheme} style={{
      padding: '4px 6.5px 4px 7px',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '',
      borderRadius: '10rem',
      border: '1.5px solid #848484ff',
      backgroundColor: theme === 'dark' ? '#232323ff' : '#e9e9e9c0', // means if theme is dark, use a dark background, else light
      color: theme === 'dark' ? '#fff' : '#000', // means if theme is dark, use white text, else black
      cursor: 'pointer'
    }}>
      {theme === 'dark' ? 'D' : 'N'}
    </button>
  )
}


// all this code is to create a button that toggles the theme between light and dark modes.