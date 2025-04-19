import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kurban } from "../services/api";
import type { Animal, KurbanReorderPayload } from "../services/api";
import { useForm } from "react-hook-form";
import { Modal } from "./Modal";
interface KurbanFormData {
  no: string;
  notes?: string;
}
export default function KurbanOrderManager() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ["animals"],
    queryFn: async () => {
      const response = await kurban.getAll();
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: ({ no, notes }: KurbanFormData) =>
      kurban.create({
        no,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      setIsAddModalOpen(false);
      setFormError(null);
    },
    onError: (error: any) => {
      console.error("Kurban ekleme hatası:", error);
      setFormError(
        "Kurban eklenirken bir hata oluştu. Lütfen tekrar deneyiniz."
      );
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KurbanFormData>();

  const onSubmit = async (data: KurbanFormData) => {
    try {
      console.log("data", data);
      await createMutation.mutateAsync({
        no: data.no,
        notes: data.notes,
      });
      setIsAddModalOpen(false);
      reset();
    } catch (error: any) {
      console.error("Error creating kurban:", error);
      setFormError(
        error.response?.data?.error || "Kurban eklenirken bir hata oluştu"
      );
    }
  };

  const reorderMutation = useMutation({
    mutationFn: async (payload: KurbanReorderPayload) => {
      return await kurban.reorder(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
    onError: (error: any) => {
      console.error("Reorder failed:", error);
      alert(
        "Sıralama güncellenirken hata oluştu: " +
          (error?.response?.data?.error || error.message)
      );
    },
  });

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    animalId: string
  ) => {
    e.dataTransfer.setData("text/plain", animalId);
    setIsDragging(animalId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetAnimal: Animal
  ) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const targetId = targetAnimal.id;

    if (!draggedId || !targetId || draggedId === targetId) {
      setIsDragging(null);
      return;
    }

    reorderMutation.mutate({ draggedId, targetId });

    setIsDragging(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const generalAnimals = animals?.sort(
    (a, b) => a.order_number - b.order_number
  );

  return (
    <>
      <div className="!bgwhite rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex justify-between">
          <h2 className="text-lg sm:text-xl font-semibold !text-gray-800 mb-2 sm:mb-4">
            Kurban Sıralaması
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base font-medium text-white !bg-blue-600 rounded-lg hover:!bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
          >
            Yeni Kurban Ekle
          </button>
        </div>

        <p className="text-xs sm:text-sm !text-gray-600 mb-4">
          Sırayı değiştirmek için sürükleyip bırakın (Masaüstü).
        </p>

        <div className="space-y-2 sm:space-y-3">
          {generalAnimals?.map((animal) => (
            <div
              key={animal.id}
              draggable
              onDragStart={(e) => handleDragStart(e, animal.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, animal)}
              className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-150 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 cursor-grab active:cursor-grabbing ${
                isDragging === animal.id
                  ? "opacity-50 border-blue-400 !bgblue-50"
                  : "!bggray-50 hover:!bggray-100 border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center flex-row">
                <div>
                  <span className=" sm:text-lg font-semibold !text-gray-900 w-12 ">
                    Kurban No : {animal.no} - Sıra No: #{animal.order_number}
                  </span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm !text-gray-500 ms-4">
                    Oluşturulma:{" "}
                    {new Date(animal.created_at).toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>
              <div
                className="!text-gray-400 hidden sm:block"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </div>
            </div>
          ))}
          {(!generalAnimals || generalAnimals.length === 0) && (
            <div className="text-center py-6 sm:py-8 text-gray-500 !bggray-50 rounded-lg text-sm sm:text-base">
              Bekleyen kurban bulunmamaktadır
            </div>
          )}
        </div>
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
            <label className="block text-sm font-medium text-gray-700">
              Kurban Numarası
            </label>
            <input
              {...register("no", {
                required: "Kurban numarası zorunludur",
                min: {
                  value: 1,
                  message: "Kurban numarası 1'den büyük olmalıdır",
                },
              })}
              className="h-8 p-2 mt-1 block w-full rounded-md !border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.no && (
              <p className="mt-1 text-sm text-red-600">{errors.no.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notlar
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              className="mt-1  p-2 block w-full rounded-md !border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              {createMutation.isPending ? "Ekleniyor..." : "Ekle"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
