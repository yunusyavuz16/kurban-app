import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kurban } from '../services/api';

const statusLabels = {
  waiting: 'Beklemede',
  slaughtering: 'Kesimde',
  skinning: 'Yüzme İşleminde',
  meat_separation: 'Et Ayrımında',
  weighing: 'Tartıda',
  packaging: 'Paketlemede',
  done: 'Tamamlandı'
};

const statusColors = {
  waiting: 'bg-yellow-50 text-yellow-900 border-yellow-300',
  slaughtering: 'bg-red-50 text-red-900 border-red-300',
  skinning: 'bg-orange-50 text-orange-900 border-orange-300',
  meat_separation: 'bg-purple-50 text-purple-900 border-purple-300',
  weighing: 'bg-blue-50 text-blue-900 border-blue-300',
  packaging: 'bg-green-50 text-green-900 border-green-300',
  done: 'bg-gray-50 text-gray-900 border-gray-300'
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

  const { data: animal, isLoading, error } = useQuery<Animal | null>({
    queryKey: ['animal', searchId],
    queryFn: async () => {
      if (!searchId) return null;
      const response = await kurban.searchByOrderNumber(parseInt(searchId));
      return response as Animal;
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sipariş Takibi</h1>
        <p className="text-gray-700">Kurban durumunu kontrol etmek için sipariş numaranızı giriniz</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Sipariş numaranızı giriniz"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-700 text-white px-6 py-3 rounded-lg hover:bg-indigo-800 transition-colors duration-200 font-medium shadow-sm"
          >
            Sipariş Ara
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-900">Bu numaraya ait sipariş bulunamadı. Lütfen kontrol edip tekrar deneyiniz.</p>
            </div>
          </div>
        </div>
      )}

      {animal && (
        <div className={`rounded-xl shadow-lg overflow-hidden ${statusColors[animal.status]}`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Sipariş #{animal.order_number}</h2>
                <p className="text-sm opacity-90">
                  Başlangıç: {new Date(animal.created_at).toLocaleString('tr-TR')}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white bg-opacity-75">
                {statusLabels[animal.status]}
              </span>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-white bg-opacity-75">
                  <div
                    style={{
                      width: `${
                        (Object.keys(statusLabels).indexOf(animal.status) + 1) *
                        (100 / Object.keys(statusLabels).length)
                      }%`
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-700"
                  ></div>
                </div>
              </div>
              <p className="text-sm text-right opacity-90">
                Son Güncelleme: {new Date(animal.updated_at).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}