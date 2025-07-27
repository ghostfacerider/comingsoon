// pages/register.tsx

import { useState } from "react";
import { useRouter } from "next/router";
import { isDisposableEmail } from "../utils/emailUtils"; 

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage("");

  if (isDisposableEmail(email)) {
    setMessage("Disposable email addresses are not allowed.");
    return;
  }

  const token = router.query.token;

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        email,
        password,
        token,
      }
    );

    if (response.data.success) {
      setMessage("Registration successful! You can now log in.");
      router.push("/admin/login");
    }
  } catch (error: any) {
    setMessage(error?.response?.data?.message || "Registration failed.");
  }
};

useEffect(() => {
  if (email && isDisposableEmail(email)) {
    setMessage("Disposable email addresses are not allowed.");
  } else {
    setMessage("");
  }
}, [email]);


const INVITE_TOKEN = process.env.NEXT_PUBLIC_INVITE_TOKEN || "secure-token-here";

const res = await fetch("http://localhost:3001/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, token }),
});

export default function Register() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const queryToken = router.query.token;
    if (process.env.NODE_ENV !== "production") {
      setAllowed(true); // allow access in dev
    } else if (queryToken === INVITE_TOKEN) {
      setAllowed(true);
    } else {
      setMessage("Access denied. Invalid or missing invite token.");
    }
  }, [router.query.token]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        {message || "Verifying token..."}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setMessage("User created successfully. You can now log in.");
        setTimeout(() => router.push("/admin"), 2000);
      } else {
        const data = await res.json();
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Registration</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="text-black px-4 py-2 rounded-md mb-3 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="text-black px-4 py-2 rounded-md mb-4 w-full"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        >
          Register
        </button>
      </form>
      {message && <p className="mt-4 text-green-400 text-center">{message}</p>}
    </div>
  
  );

}
