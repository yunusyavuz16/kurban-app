import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { kurban, statuses } from '../services/api';
import type { Animal, KurbanStatus } from '../services/api';

// Define environment variables type
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

// Remove hardcoded status labels and colors
// const statusLabels = { ... };
// const statusColors = { ... };

export default function TVDisplay() {
  const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
  const queryClient = useQueryClient();

  // Fetch animals (response includes nested status object)
  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
      queryKey: ['animals'],
      queryFn: kurban.getAll,
      refetchInterval: 5000
  });

  // Fetch statuses
  const { data: kurbanStatuses, isLoading: isLoadingStatuses } = useQuery<KurbanStatus[]>({
      queryKey: ['statuses'],
      queryFn: statuses.getAll,
      // Stale time can be longer if statuses don't change often
      staleTime: 60 * 1000 * 5, // 5 minutes
  });

  // Subscribe to real-time updates
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

  // Automatically switch tabs every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTab((prevTab) => (prevTab === 'current' ? 'all' : 'current'));
    }, 30000); // 30 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Combined loading state
  if (isLoadingAnimals || isLoadingStatuses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  // Helper function to get status details by name
  const getStatusDetails = (statusName: string): KurbanStatus | undefined => {
      return kurbanStatuses?.find(s => s.name === statusName);
  }
  // Helper to get style string from status object
  const getStatusStyleString = (status?: KurbanStatus): string => {
      if (!status) return '!bg-gray-100 text-gray-800 border-gray-300';
      return `${status.color_bg} ${status.color_text} ${status.color_border}`;
  }

  // Filter animals based on status name, with null checks
  const processingAnimals = animals?.filter(animal =>
    animal?.status?.name === 'slaughtering'
  ).sort((a, b) => a.order_number - b.order_number);

  const waitingAnimals = animals?.filter(animal =>
    animal?.status?.name === 'waiting'
  ).sort((a, b) => a.order_number - b.order_number);

  // Group animals by status name for the "all" view, with null checks
  const animalsByStatusName = animals?.reduce((acc, animal) => {
    if (!animal?.status?.name) return acc;

    const statusName = animal.status.name;
    if (!acc[statusName]) {
      acc[statusName] = [];
    }
    acc[statusName].push(animal);
    return acc;
  }, {} as Record<string, Animal[]>);

  // Sort statuses for display in the "all" tab based on display_order
  const sortedStatuses = kurbanStatuses?.sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen !bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">Kurban İşlem Durumu</h1>
      </div>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6 md:mb-8">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 sm:px-6 md:px-8 sm:py-3 md:py-4 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200
            ${activeTab === 'current'
              ? '!bg-blue-600 text-white shadow-lg'
              : '!bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          Anlık Durum
        </button>
        <button
          onClick={() => setActiveTab('all')}
           className={`px-4 py-2 sm:px-6 md:px-8 sm:py-3 md:py-4 rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-all duration-200
            ${activeTab === 'all'
              ? '!bg-blue-600 text-white shadow-lg'
              : '!bg-white text-gray-600 hover:bg-gray-100'}`}
        >
          Tüm Durumlar
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-6 md:space-y-8">
          <div className="!bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Kesimdeki Kurbanlar</h2>
            <div className="grid gap-4 md:gap-6">
              {processingAnimals?.map((animal) => (
                <div
                  key={animal.id}
                  className={`p-4 sm:p-6 rounded-lg border-2 ${getStatusStyleString(animal.status)} transition-all duration-200`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold">#{animal.order_number}</span>
                      <div className="mt-1 sm:mt-2 text-base sm:text-lg font-medium">
                        {animal.status?.label || 'Durum Bilinmiyor'}
                      </div>
                    </div>
                    <span className="text-base sm:text-lg md:text-xl">
                      {new Date(animal.updated_at).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
              {(!processingAnimals || processingAnimals.length === 0) && (
                <div className="text-gray-500 text-center py-8 md:py-12 !bg-gray-50 rounded-lg text-lg md:text-xl">
                  Şu anda kesimde kurban bulunmamaktadır
                </div>
              )}
            </div>
          </div>

          <div className="!bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4 md:mb-6">Sıradaki Kurbanlar</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {waitingAnimals?.map((animal) => {
                  const waitingStatus = getStatusDetails('waiting');
                  return (
                    <span
                      key={animal.id}
                      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg border font-medium text-base sm:text-lg md:text-xl ${getStatusStyleString(waitingStatus)}`}
                    >
                      #{animal.order_number}
                    </span>
                  );
              })}
              {(!waitingAnimals || waitingAnimals.length === 0) && (
                <div className="text-gray-500 text-center py-6 md:py-8 w-full !bg-gray-50 rounded-lg text-lg md:text-xl">
                  Bekleyen kurban bulunmamaktadır
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedStatuses?.map((status) => (
            <div key={status.id} className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-2">{status.label}</h2>
              <div className="space-y-2 sm:space-y-3">
                {animalsByStatusName?.[status.name]?.map((animal) => (
                  <div
                    key={animal.id}
                    className={`p-3 sm:p-4 rounded-lg border-2 ${getStatusStyleString(animal.status)} transition-all duration-200`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xl sm:text-2xl font-bold">#{animal.order_number}</span>
                      <span className="text-sm sm:text-base">
                        {new Date(animal.updated_at).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
                {(!animalsByStatusName?.[status.name] || animalsByStatusName[status.name].length === 0) && (
                  <div className="text-gray-500 text-center py-4 !bg-gray-50 rounded-lg">
                    Bu durumda kurban bulunmamaktadır
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}