import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kurban } from '../services/api';

interface MeatPieces {
  leg: number;
  arm: number;
  chest: number;
  back: number;
  ground?: number;
}

interface Animal {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  weight?: number;
  notes?: string;
  slaughter_time?: string;
  butcher_name?: string;
  package_count?: number;
  meat_pieces?: MeatPieces;
}

const statusOptions = {
  waiting: 'Bekliyor',
  slaughtering: 'Kesimde',
  skinning: 'Yüzme',
  meat_separation: 'Et Ayrımı',
  weighing: 'Tartı',
  packaging: 'Paketleme',
  done: 'Tamamlandı'
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

const getStatusStyle = (status: string) => {
  if (status === 'all') return 'bg-white text-gray-900';
  return statusColors[status as keyof typeof statusColors];
};

interface StatusFormProps {
  animal: Animal;
  onUpdate: (data: Partial<Animal>) => void;
}

const StatusForms: Record<string, React.FC<StatusFormProps>> = {
  slaughtering: ({ animal, onUpdate }) => (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Kesim Saati</label>
        <input
          type="time"
          value={animal.slaughter_time || ''}
          onChange={(e) => onUpdate({ slaughter_time: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Kasap</label>
        <input
          type="text"
          value={animal.butcher_name || ''}
          onChange={(e) => onUpdate({ butcher_name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Kasap adını girin"
        />
      </div>
    </div>
  ),

  meat_separation: ({ animal, onUpdate }) => {
    const currentPieces = animal.meat_pieces || {
      leg: 0,
      arm: 0,
      chest: 0,
      back: 0,
      ground: 0
    };

    const updatePieces = (key: keyof MeatPieces, value: number) => {
      onUpdate({
        meat_pieces: {
          ...currentPieces,
          [key]: value
        }
      });
    };

    return (
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Kol Sayısı</label>
            <input
              type="number"
              value={currentPieces.arm}
              onChange={(e) => updatePieces('arm', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">But Sayısı</label>
            <input
              type="number"
              value={currentPieces.leg}
              onChange={(e) => updatePieces('leg', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Göğüs Sayısı</label>
            <input
              type="number"
              value={currentPieces.chest}
              onChange={(e) => updatePieces('chest', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sırt Sayısı</label>
            <input
              type="number"
              value={currentPieces.back}
              onChange={(e) => updatePieces('back', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kıyma (kg)</label>
            <input
              type="number"
              value={currentPieces.ground || 0}
              onChange={(e) => updatePieces('ground', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>
    );
  },

  weighing: ({ animal, onUpdate }) => (
    <div className="mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Toplam Ağırlık (kg)</label>
        <input
          type="number"
          value={animal.weight || ''}
          onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          step="0.1"
          min="0"
        />
      </div>
    </div>
  ),

  packaging: ({ animal, onUpdate }) => (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Paket Sayısı</label>
        <input
          type="number"
          value={animal.package_count || ''}
          onChange={(e) => onUpdate({ package_count: parseInt(e.target.value) || 0 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          min="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notlar</label>
        <textarea
          value={animal.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
          placeholder="Paketleme ile ilgili özel notlar..."
        />
      </div>
    </div>
  )
};

export default function StaffPanel() {
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('waiting');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: () => kurban.getAll()
  });

  const createMutation = useMutation({
    mutationFn: (orderNumber: number) => kurban.create({ order_number: orderNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setNewOrderNumber('');
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Animal> }) =>
      kurban.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrderNumber) {
      createMutation.mutate(parseInt(newOrderNumber));
    }
  };

  const handleStatusUpdate = (animal: Animal, newStatus: string) => {
    updateMutation.mutate({
      id: animal.id,
      data: { status: newStatus }
    });
  };

  const handleDataUpdate = (animal: Animal, data: Partial<Animal>) => {
    updateMutation.mutate({
      id: animal.id,
      data: data
    });
  };

  const filteredAnimals = animals?.filter(animal =>
    selectedStatus === 'all' ? true : animal.status === selectedStatus
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personel Paneli</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kurban kayıtlarını yönetin ve durumlarını güncelleyin
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Yeni Kayıt Ekle
        </button>
      </div>

      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Durum Filtresi
        </label>
        <div className="relative">
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium ${getStatusStyle(selectedStatus)}`}
            style={{ minHeight: '44px' }}
          >
            <option value="all" className="bg-white text-gray-900 font-medium">Tümü</option>
            {Object.entries(statusOptions).map(([value, label]) => (
              <option
                key={value}
                value={value}
                className={`${statusColors[value as keyof typeof statusColors]} font-medium`}
              >
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals?.map((animal) => (
            <div
              key={animal.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Sıra #{animal.order_number}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(animal.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={animal.status}
                    onChange={(e) => handleStatusUpdate(animal, e.target.value)}
                    className={`appearance-none text-sm px-4 py-2 border rounded-lg font-medium ${
                      statusColors[animal.status as keyof typeof statusColors]
                    }`}
                    style={{ minHeight: '38px', minWidth: '140px' }}
                  >
                    {Object.entries(statusOptions).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                        className={`${statusColors[value as keyof typeof statusColors]} font-medium`}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status-specific forms */}
              {animal.status in StatusForms && (
                <div key={animal.status}>
                  {React.createElement(StatusForms[animal.status], {
                    animal,
                    onUpdate: (data) => handleDataUpdate(animal, data)
                  })}
                </div>
              )}

              <div className="text-sm text-gray-600 mt-4">
                <p>Son Güncelleme: {new Date(animal.updated_at).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Kurban Kaydı</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Sıra Numarası
                </label>
                <input
                  type="number"
                  id="orderNumber"
                  value={newOrderNumber}
                  onChange={(e) => setNewOrderNumber(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}