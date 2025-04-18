import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { kurban } from '../services/api';
import TVDisplay from './TVDisplay';

interface Animal {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
}

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
  waiting: '!bgyellow-50 text-yellow-900 border-yellow-300',
  slaughtering: '!bgred-50 text-red-900 border-red-300',
  skinning: '!bgorange-50 text-orange-900 border-orange-300',
  meat_separation: '!bgpurple-50 text-purple-900 border-purple-300',
  weighing: '!bgblue-50 text-blue-900 border-blue-300',
  packaging: '!bggreen-50 text-green-900 border-green-300',
  done: '!bggray-50 text-gray-900 border-gray-300'
};

export default function KurbanProcessingStatus() {
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await kurban.getAll();
      return response;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Filter animals based on status
  const processingAnimals = animals?.filter(animal =>
    animal.status === 'slaughtering' ||
    animal.status === 'skinning' ||
    animal.status === 'meat_separation'
  ).sort((a, b) => a.order_number - b.order_number);

  const waitingAnimals = animals?.filter(animal => animal.status === 'waiting')
    .sort((a, b) => a.order_number - b.order_number);

  return (
    <div className="min-h-screen !bggray-50 p-4 md:p-8">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200
            ${activeTab === 'current'
              ? '!bg-blue-600 text-white shadow-lg'
              : '!bg-white text-gray-600 hover:!bggray-50'}`}
        >
          Anlık Durum
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200
            ${activeTab === 'all'
              ? '!bg-blue-600 text-white shadow-lg'
              : '!bg-white text-gray-600 hover:!bggray-50'}`}
        >
          Tüm Durumlar
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-8">
          {/* Current Processing Section */}
          <div className="!bgwhite rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">İşlemdeki Kurbanlar</h2>
            <div className="grid gap-4">
              {processingAnimals?.map((animal) => (
                <div
                  key={animal.id}
                  className={`p-4 rounded-lg border-2 ${statusColors[animal.status as keyof typeof statusColors]} transition-all duration-200`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold">#{animal.order_number}</span>
                      <div className="mt-1 text-sm font-medium">
                        {statusLabels[animal.status as keyof typeof statusLabels]}
                      </div>
                    </div>
                    <span className="text-sm">
                      {new Date(animal.updated_at).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
              {(!processingAnimals || processingAnimals.length === 0) && (
                <div className="text-gray-500 text-center py-8 !bggray-50 rounded-lg">
                  Şu anda işlemde kurban bulunmamaktadır
                </div>
              )}
            </div>
          </div>

          {/* Waiting Section */}
          <div className="!bgwhite rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sıradaki Kurbanlar</h2>
            <div className="flex flex-wrap gap-2">
              {waitingAnimals?.map((animal) => (
                <span
                  key={animal.id}
                  className="px-4 py-2 !bgyellow-50 text-yellow-800 rounded-lg border border-yellow-200 font-medium"
                >
                  #{animal.order_number}
                </span>
              ))}
              {(!waitingAnimals || waitingAnimals.length === 0) && (
                <div className="text-gray-500 text-center py-4 w-full !bggray-50 rounded-lg">
                  Bekleyen kurban bulunmamaktadır
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // All Statuses Tab - Using TVDisplay component
        <TVDisplay />
      )}
    </div>
  );
}