"use client";
import Head from "next/head";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form refresh

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setIsError(true);
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("http://localhost:3001/mailing-list/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(
          data.message || "Successfully subscribed to our mailing list!"
        );
        setIsError(false);
        setEmail(""); // Clear the input on success
      } else {
        setMessage(data.message || "Subscription failed. Please try again.");
        setIsError(true);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      setMessage("Subscription failed. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white flex flex-col items-center justify-center p-6">
      <Head>
        <title>Coming Soon</title>
        <meta
          name="description"
          content="A dynamic sports bracket application coming soon"
        />
      </Head>
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4" />
        </div>
        <h1 className="text-4xl font-bold mb-4">COMING SOON</h1>
        <p className="text-lg max-w-md mx-auto mb-6">
          A dynamic sports bracket application that updates in real time
          throughout the season.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="text-black px-4 py-2 rounded-md w-72 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            {isLoading ? "Subscribing..." : "Join Our Mailing List"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 ${isError ? "text-red-400" : "text-green-400"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
