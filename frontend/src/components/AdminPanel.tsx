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
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const completedAnimals = animals?.filter(a => a.status === 'done').length || 0;
  const totalAnimals = animals?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Yönetici Paneli</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Toplam Kurban</h3>
          <p className="text-4xl font-bold text-blue-600">{totalAnimals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Tamamlanan</h3>
          <p className="text-4xl font-bold text-green-600">{completedAnimals}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Devam Eden</h3>
          <p className="text-4xl font-bold text-orange-600">{totalAnimals - completedAnimals}</p>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Kullanıcı Yönetimi</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email"
              className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Şifre"
              className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')}
              className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Personel</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg shadow-md"
          >
            Kullanıcı Oluştur
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Mevcut Kullanıcılar</h3>
          <div className="space-y-3">
            {users?.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium">{user.email}</span>
                <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {user.role === 'admin' ? 'Yönetici' : 'Personel'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Son Aktiviteler</h2>
        <div className="space-y-4">
          {animals?.slice(0, 5).map((animal) => (
            <div key={animal.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-lg font-semibold text-gray-800">Kurban #{animal.order_number}</p>
                <p className="text-sm text-gray-600">
                  Son güncelleme: {new Date(animal.updated_at).toLocaleTimeString()}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                animal.status === 'done'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}>
                {animal.status === 'done' ? 'Tamamlandı' : 'Devam Ediyor'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}