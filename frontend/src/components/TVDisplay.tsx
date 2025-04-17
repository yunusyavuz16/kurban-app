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
  waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  slaughtering: 'bg-red-100 text-red-800 border-red-200',
  skinning: 'bg-orange-100 text-orange-800 border-orange-200',
  meat_separation: 'bg-purple-100 text-purple-800 border-purple-200',
  weighing: 'bg-blue-100 text-blue-800 border-blue-200',
  packaging: 'bg-green-100 text-green-800 border-green-200',
  done: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  waiting: 'Waiting',
  slaughtering: 'Being Slaughtered',
  skinning: 'Skin Removal',
  meat_separation: 'Meat Separation',
  weighing: 'Weighing',
  packaging: 'Packaging',
  done: 'Completed'
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
    <div className="space-y-8 bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Kurban Processing Status</h1>
        <p className="mt-2 text-gray-600">Real-time status updates for all orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">{label}</h2>
            <div className="space-y-3">
              {animalsByStatus?.[status]?.map((animal) => (
                <div
                  key={animal.id}
                  className={`p-4 rounded-lg border-2 ${statusColors[animal.status]} transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">#{animal.order_number}</span>
                    <span className="text-sm">
                      {new Date(animal.updated_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    Started: {new Date(animal.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {(!animalsByStatus?.[status] || animalsByStatus[status].length === 0) && (
                <div className="text-gray-400 text-center py-4">No orders</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}