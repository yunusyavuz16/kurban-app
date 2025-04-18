import React, { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kurban, statuses } from '../services/api';
import type { Animal, KurbanStatus, KurbanUpdatePayload } from '../services/api';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';

interface MeatPieces {
  leg: number;
  arm: number;
  chest: number;
  back: number;
  ground: number;
}

interface StatusFormProps {
  animal: Animal;
  onUpdate: (data: Partial<KurbanUpdatePayload>) => void;
}

interface KurbanFormData {
  order_number: number;
  notes?: string;
}

const StatusForms: Record<string, React.FC<StatusFormProps>> = {
  slaughtering: () => null,
  skinning: () => null,
  cleaning: () => null,
  packaging: () => null,
  completed: () => null,
  cancelled: () => null,
  waiting: () => null
};

export default function StaffPanel() {
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [updatedAnimalData, setUpdatedAnimalData] = useState<Partial<KurbanUpdatePayload>>({});

  const queryClient = useQueryClient();

  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: kurban.getAll
  });

  const { data: kurbanStatuses, isLoading: isLoadingStatuses } = useQuery<KurbanStatus[]>({
    queryKey: ['statuses'],
    queryFn: statuses.getAll,
    staleTime: 60 * 1000 * 5,
  });

  const createMutation = useMutation({
    mutationFn: ({ order_number, notes }: KurbanFormData) => kurban.create({
      order_number,
      notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setIsAddModalOpen(false);
      setFormError(null);
    },
    onError: (error: any) => {
      console.error('Kurban ekleme hatası:', error);
      setFormError('Kurban eklenirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KurbanUpdatePayload> }) =>
      kurban.update(id, data),
    onSuccess: (updatedAnimal) => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setIsDetailModalOpen(false);
      setUpdatedAnimalData({});
    },
    onError: (error: any) => {
      console.error("Update error:", error);
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<KurbanFormData>();

  const onSubmit = async (data: KurbanFormData) => {
    try {
      await createMutation.mutateAsync({
        order_number: data.order_number,
        notes: data.notes
      });
      setIsAddModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error creating kurban:', error);
      setFormError(error.response?.data?.error || 'Kurban eklenirken bir hata oluştu');
    }
  };

  const openDetailModal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setUpdatedAnimalData({});
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = (animalId: string, newStatusId: string) => {
    updateMutation.mutate({ id: animalId, data: { status_id: newStatusId } });
  };

  const handleDetailDataChange = (updates: Partial<KurbanUpdatePayload>) => {
    setUpdatedAnimalData(prev => ({ ...prev, ...updates }));
  };

  const handleDetailSave = () => {
    if (selectedAnimal && Object.keys(updatedAnimalData).length > 0) {
      updateMutation.mutate({ id: selectedAnimal.id, data: updatedAnimalData });
    }
  };

  const filteredAnimals = animals?.filter(animal =>
    selectedStatusFilter === 'all' || animal.status.id === selectedStatusFilter
  );

  const sortedStatuses = kurbanStatuses?.sort((a, b) => a.display_order - b.display_order);

  const getStatusStyleString = (status?: KurbanStatus): string => {
    if (!status) return '!bg-gray-100 text-gray-800 border-gray-300';
    return `${status.color_bg} ${status.color_text} ${status.color_border}`;
  };

  if (isLoadingAnimals || isLoadingStatuses) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen !bg-gray-50 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          Personel Paneli
        </h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base font-medium text-white !bg-blue-600 rounded-lg hover:!bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
        >
          Yeni Kurban Ekle
        </button>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-lg border transition-colors duration-150 ${
              selectedStatusFilter === 'all'
                ? '!bg-blue-600 text-white border-blue-600'
                : '!bg-white text-gray-700 border-gray-300 hover:!bg-gray-100'
            }`}
          >
            Tümü
          </button>
          {sortedStatuses?.map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatusFilter(status.id)}
              className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-lg border transition-colors duration-150 ${getStatusStyleString(status)} ${
                selectedStatusFilter === status.id
                  ? 'ring-2 ring-offset-1 ring-black'
                  : ''
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAnimals?.map((animal) => (
          <div
            key={animal.id}
            className="!bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                Kurban #{animal.order_number}
              </h2>
              <span
                className={`inline-block px-3 py-1 mb-3 rounded-full text-xs sm:text-sm font-semibold ${getStatusStyleString(animal.status)}`}
              >
                {animal.status.label}
              </span>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                Oluşturma: {new Date(animal.created_at).toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                Güncelleme: {new Date(animal.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="mt-auto">
              <select
                value={animal.status.id}
                onChange={(e) => handleStatusUpdate(animal.id, e.target.value)}
                className={`w-full p-2 text-sm sm:text-base rounded-md border shadow-sm mb-3 ${getStatusStyleString(animal.status)} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
                disabled={updateMutation.isPending && updateMutation.variables?.id === animal.id && !!updateMutation.variables?.data.status_id}
              >
                {sortedStatuses?.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
              <button
                onClick={() => openDetailModal(animal)}
                className="w-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-white !bg-gray-700 rounded-lg hover:!bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Detaylar / Güncelle
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormError(null);
          reset();
        }}
        title="Yeni Kurban Ekle"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="!bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="text-sm">{formError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Kurban Numarası</label>
            <input
              type="number"
              {...register('order_number', {
                required: 'Kurban numarası zorunludur',
                min: { value: 1, message: 'Kurban numarası 1\'den büyük olmalıdır' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.order_number && (
              <p className="mt-1 text-sm text-red-600">{errors.order_number.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notlar</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="İsteğe bağlı notlar..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormError(null);
                reset();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 !bg-white border border-gray-300 rounded-md hover:!bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white !bg-blue-600 border border-transparent rounded-md hover:!bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </Modal>

      <Transition appear show={isDetailModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsDetailModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 !bg-black !bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl !bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4"
                  >
                    Kurban #{selectedAnimal?.order_number} Detayları
                  </Dialog.Title>

                  {selectedAnimal && (
                    <div className="mt-2 space-y-4">
                      <p className="text-sm sm:text-base">
                         Mevcut Durum: <span className={`font-semibold ${getStatusStyleString(selectedAnimal.status)} px-2 py-0.5 rounded`}>{selectedAnimal.status.label}</span>
                      </p>

                      {StatusForms[selectedAnimal.status.name] && React.createElement(StatusForms[selectedAnimal.status.name], { animal: selectedAnimal, onUpdate: handleDetailDataChange })}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent !bg-blue-600 px-4 py-2 text-sm sm:text-base font-medium text-white shadow-sm hover:!bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={handleDetailSave}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 !bg-white px-4 py-2 text-sm sm:text-base font-medium text-gray-700 shadow-sm hover:!bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setIsDetailModalOpen(false)}
                    >
                      Kapat
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}