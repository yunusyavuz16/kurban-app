import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kurban } from '../services/api';

// Define environment variables type
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

const statusColors = {
  waiting: 'bg-yellow-50 text-yellow-900 border-yellow-300',
  slaughtering: 'bg-red-50 text-red-900 border-red-300',
  skinning: 'bg-orange-50 text-orange-900 border-orange-300',
  meat_separation: 'bg-purple-50 text-purple-900 border-purple-300',
  weighing: 'bg-blue-50 text-blue-900 border-blue-300',
  packaging: 'bg-green-50 text-green-900 border-green-300',
  done: 'bg-gray-50 text-gray-900 border-gray-300'
};

const statusLabels = {
  waiting: 'Beklemede',
  slaughtering: 'Kesimde',
  skinning: 'Yüzme İşleminde',
  meat_separation: 'Et Ayrımında',
  weighing: 'Tartıda',
  packaging: 'Paketlemede',
  done: 'Tamamlandı'
};

interface Animal {
  id: string;
  order_number: number;
  status: keyof typeof statusColors;
  created_at: string;
  updated_at: string;
}

export default function TVDisplay() {
  const queryClient = useQueryClient();

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      const response = await kurban.getAll();
      return response;
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Subscribe to real-time updates using SSE
  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/kurban/subscribe`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Group animals by status
  const animalsByStatus = animals?.reduce((acc, animal) => {
    if (!acc[animal.status]) {
      acc[animal.status] = [];
    }
    acc[animal.status].push(animal);
    return acc;
  }, {} as Record<string, Animal[]>);

  return (
    <div className="space-y-8 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Kurban İşlem Durumu</h1>
        <p className="mt-2 text-gray-700">Tüm siparişlerin anlık durumu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{label}</h2>
            <div className="space-y-3">
              {animalsByStatus?.[status]?.map((animal) => (
                <div
                  key={animal.id}
                  className={`p-4 rounded-lg border-2 ${statusColors[animal.status]} transition-all duration-200 hover:scale-105 shadow-sm`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">#{animal.order_number}</span>
                    <span className="text-sm font-medium">
                      {new Date(animal.updated_at).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    Başlangıç: {new Date(animal.created_at).toLocaleTimeString('tr-TR')}
                  </div>
                </div>
              ))}
              {(!animalsByStatus?.[status] || animalsByStatus[status].length === 0) && (
                <div className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-200">Sipariş Yok</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}