import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kurban } from "../services/api";
import type { Animal, KurbanReorderPayload } from "../services/api";

export default function KurbanOrderManager() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ["animals"],
    queryFn: async () => {
      const response = await kurban.getAll();
      return response;
    },
  });

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
    <div className="!bgwhite rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
      <h2 className="text-lg sm:text-xl font-semibold !text-gray-800 mb-2 sm:mb-4">
        Kurban Sıralaması
      </h2>
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
                  Sıra No: #{animal.order_number} - Kurban No : {animal.no}
                </span>
              </div>
              <div>
                <span className="text-xs sm:text-sm !text-gray-500 ms-4">
                  Oluşturulma:{" "}
                  {new Date(animal.created_at).toLocaleString("tr-TR")}
                </span>
              </div>
            </div>
            <div className="!text-gray-400 hidden sm:block" aria-hidden="true">
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
  );
}
