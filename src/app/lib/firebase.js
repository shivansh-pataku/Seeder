// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtTJXaK-7MHMQ5NjoeF0gecYJJMdwdnMs",
  authDomain: "seeder-sp.firebaseapp.com",
  projectId: "seeder-sp",
  storageBucket: "seeder-sp.firebasestorage.app",
  messagingSenderId: "938345088902",
  appId: "1:938345088902:web:c7e5f8977bbf14940bce07",
  measurementId: "G-QNP267W8YC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);