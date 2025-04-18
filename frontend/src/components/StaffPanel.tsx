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

const getStatusStyle = (status: string) => {
  if (status === 'all') return 'bg-white text-gray-900 border border-gray-300';
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Personel Paneli</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 transition-colors duration-200"
          >
            Yeni Sipariş Ekle
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-900 mb-2">
            Durum Filtresi
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 transition-colors duration-200 font-medium ${getStatusStyle(selectedStatus)}`}
          >
            <option value="all" className="text-gray-900 bg-white">Tüm Siparişler</option>
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
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {animals
              ?.filter(animal => selectedStatus === 'all' ? true : animal.status === selectedStatus)
              .map(animal => (
                <div
                  key={animal.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Sipariş #{animal.order_number}
                      </h3>
                      <p className="text-sm text-gray-700">
                        Oluşturulma: {new Date(animal.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <select
                      value={animal.status}
                      onChange={(e) => handleStatusUpdate(animal, e.target.value)}
                      className={`rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 transition-colors duration-200 ${
                        statusColors[animal.status as keyof typeof statusColors]
                      } font-medium`}
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
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Sipariş Ekle</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-900">
                  Sipariş Numarası
                </label>
                <input
                  type="number"
                  id="orderNumber"
                  value={newOrderNumber}
                  onChange={(e) => setNewOrderNumber(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors duration-200"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}