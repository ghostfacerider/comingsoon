import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { saveAs } from "file-saver";

export default function AdminDashboard() {
  const [subscribers, setSubscribers] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setAuthenticated(true);
        fetchSubscribers(token);
      } else {
        setAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
      setAuthenticated(false);
    }
  };

  const fetchSubscribers = async (token: string) => {
    const res = await fetch("http://localhost:3001/mailing-list/subscribers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubscribers(data);
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const res = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("admin-token", data.token);
      setAuthenticated(true);
      fetchSubscribers(data.token);
    } else {
      alert("Invalid login");
    }
  };

  const exportCSV = () => {
    const csv = [
      ["Email", "Confirmed At"],
      ...subscribers.map((s) => [
        s.email,
        new Date(s.updatedAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "confirmed-subscribers.csv");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#1e1b2e] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col items-center">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="text-black px-4 py-2 rounded-md mb-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="text-black px-4 py-2 rounded-md mb-4"
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1b2e] text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <button
        onClick={exportCSV}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
      >
        Export CSV
      </button>
      <table className="w-full table-auto text-left border-collapse border border-gray-700">
        <thead>
          <tr className="bg-gray-800">
            <th className="border border-gray-700 px-4 py-2">Email</th>
            <th className="border border-gray-700 px-4 py-2">Confirmed At</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((sub, index) => (
            <tr key={index} className="hover:bg-gray-700">
              <td className="border border-gray-700 px-4 py-2">{sub.email}</td>
              <td className="border border-gray-700 px-4 py-2">
                {new Date(sub.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
