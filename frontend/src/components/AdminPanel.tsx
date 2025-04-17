import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kurban, auth } from '../services/api';

interface Animal {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');

  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await kurban.getAll();
      return response;
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await auth.getUsers();
      return response;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: 'admin' | 'staff' }) => {
      const response = await auth.register(email, password, role);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewUserEmail('');
      setNewUserPassword('');
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole
    });
  };

  if (isLoadingAnimals || isLoadingUsers) {
    return <div>Loading...</div>;
  }

  const completedAnimals = animals?.filter(a => a.status === 'done').length || 0;
  const totalAnimals = animals?.length || 0;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Animals</h3>
          <p className="text-3xl font-bold">{totalAnimals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold">{completedAnimals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">In Progress</h3>
          <p className="text-3xl font-bold">{totalAnimals - completedAnimals}</p>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email"
              className="p-2 border rounded"
              required
            />
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Password"
              className="p-2 border rounded"
              required
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')}
              className="p-2 border rounded"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create User
          </button>
        </form>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Existing Users</h3>
          <div className="space-y-2">
            {users?.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{user.email}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {animals?.slice(0, 5).map((animal) => (
            <div key={animal.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
              <div>
                <p className="font-semibold">Order #{animal.order_number}</p>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(animal.updated_at).toLocaleTimeString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                animal.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {animal.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}