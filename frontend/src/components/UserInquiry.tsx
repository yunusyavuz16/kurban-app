import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kurban } from '../services/api';

const statusLabels = {
  waiting: 'Waiting',
  slaughtering: 'Being Slaughtered',
  skinning: 'Skin Removal',
  meat_separation: 'Meat Separation',
  weighing: 'Weighing',
  packaging: 'Packaging',
  done: 'Completed'
};

const statusColors = {
  waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  slaughtering: 'bg-red-100 text-red-800 border-red-200',
  skinning: 'bg-orange-100 text-orange-800 border-orange-200',
  meat_separation: 'bg-purple-100 text-purple-800 border-purple-200',
  weighing: 'bg-blue-100 text-blue-800 border-blue-200',
  packaging: 'bg-green-100 text-green-800 border-green-200',
  done: 'bg-gray-100 text-gray-800 border-gray-200'
};

interface Animal {
  id: string;
  order_number: number;
  status: keyof typeof statusLabels;
  created_at: string;
  updated_at: string;
}

export default function UserInquiry() {
  const [orderNumber, setOrderNumber] = useState('');
  const [searchId, setSearchId] = useState<string | null>(null);

  const { data: animal, isLoading, error } = useQuery<Animal>({
    queryKey: ['animal', searchId],
    queryFn: async () => {
      if (!searchId) return null;
      const response = await kurban.searchByOrderNumber(parseInt(searchId));
      return response;
    },
    enabled: !!searchId
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchId(orderNumber);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-600">Enter your order number to check its current status</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter your order number"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
          >
            Search Order
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">No order found with this number. Please check and try again.</p>
            </div>
          </div>
        </div>
      )}

      {animal && (
        <div className={`rounded-xl shadow-lg overflow-hidden ${statusColors[animal.status]}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Order #{animal.order_number}</h2>
                <p className="text-sm opacity-75">
                  Started: {new Date(animal.created_at).toLocaleString()}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white bg-opacity-50">
                {statusLabels[animal.status]}
              </span>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-white bg-opacity-50">
                  <div
                    style={{
                      width: `${
                        (Object.keys(statusLabels).indexOf(animal.status) + 1) *
                        (100 / Object.keys(statusLabels).length)
                      }%`
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                  ></div>
                </div>
              </div>
              <p className="text-sm text-right opacity-75">
                Last Updated: {new Date(animal.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}