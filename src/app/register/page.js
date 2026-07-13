'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminRegister() {
  const [registrationKey, setRegistrationKey] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:3092/admin/register-admin', {
        registrationKey,
        firstName,
        lastName,
        email,
        password
      }, { withCredentials: true });

      router.push('/admin'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Registration</h1>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Registration Key"
          value={registrationKey}
          onChange={(e) => setRegistrationKey(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
       
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
        <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition">
          Register Admin
        </button>
      </form>
    </div>
  );
}
