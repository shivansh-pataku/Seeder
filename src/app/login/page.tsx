"use client";
import React, { useState } from "react";
import styles from "../Styles/logsig.module.css"


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);


    try {
        if (email === "" || password === "") {
        throw new Error("Please enter both email and password.");
        }

        // Send POST request to your API route
        const res = await fetch("../auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
        throw new Error(data.error || data || "Login failed.");
        }

        // On success, you can redirect or set auth state
        // alert("Login successful!");
        setSuccess(true);
        // Optionally: save token/cookie, redirect, etc.
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }

}




    return (
        <div className={styles["logsig-container"]}>

                <form className={styles["logsig-form"]} onSubmit={handleSubmit} autoComplete="off">

                    <h2 className={styles["logsig-title"]}>Sign In</h2>

                    {error && <div className={styles["logsig-error"]}>{error}</div>}
                    

                    <div className={styles["logsig-field"]}>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />
                    </div>

                    <div className={styles["logsig-field"]}>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                    />
                    </div>

                    <button className={styles["logsig-button"]} type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                    </button>

                    {success && <div className={styles["logsig-message"]}>Login Success</div>}
                    
                    <div className={styles["logsig-links"]}>
                    <a href="#">Forgot password?</a>
                    <span> | </span>
                    <a href="/signup">Create account</a>
                    </div>
                
                </form>

                </div>
            );
}