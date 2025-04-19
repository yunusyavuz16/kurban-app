import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { kurban, KurbanStatus } from "../services/api";



const statusColors = {
  waiting: "!bg-yellow-50 text-yellow-900 border-yellow-300",
  slaughtering: "!bg-red-50 text-red-900 border-red-300",
  skinning: "!bg-orange-50 text-orange-900 border-orange-300",
  meat_separation: "!bg-purple-50 text-purple-900 border-purple-300",
  weighing: "!bg-blue-50 text-blue-900 border-blue-300",
  packaging: "!bg-green-50 text-green-900 border-green-300",
  done: "!bg-gray-50 text-gray-900 border-gray-300",
};

interface Animal {
  id: string;
  order_number: number;
  status: KurbanStatus,
  created_at: string;
  updated_at: string;
  kurban_status: KurbanStatus
  no: string;
}

export default function UserInquiry() {
  // this look for kurban no
  const [orderNumber, setOrderNumber] = useState("");
  const [searchId, setSearchId] = useState<string | null>(null);

  const {
    data: animal,
    isLoading,
    error,
  } = useQuery<Animal | null>({
    queryKey: ["animal", searchId],
    queryFn: async () => {
      if (!searchId) return null;
      const response = await kurban.getById(searchId);
      return response as Animal;
    },
    enabled: !!searchId,
  });


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchId(orderNumber);
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto p-4 sm:p-8">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
          Kurban Takibi
        </h1>
        <p className="text-sm sm:text-base text-gray-700">
          Kurban durumunu kontrol etmek için Kurban numaranızı giriniz
        </p>
      </div>

      <div className="!bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Kurban numaranızı giriniz"
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all duration-200 text-sm sm:text-base text-gray-900 placeholder-gray-500 !bg-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full !bg-indigo-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:!bg-indigo-800 transition-colors duration-200 text-sm sm:text-base font-medium shadow-sm"
          >
            Kurban Ara
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {error && (
        <div className="!bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-900">
                Bu numaraya ait Kurban bulunamadı. Lütfen kontrol edip tekrar
                deneyiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {animal && (
        <div
          className={`rounded-xl shadow-lg overflow-hidden !bg-white !${
            animal?.status?.color_bg
          }`}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Kurban #{animal.no}</h2>
                <h3 className="text-2xl font-bold mb-1 text-gray-700">Sıra #{animal.order_number}</h3>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold !bg-white !bg-opacity-75">
                {animal.kurban_status?.label}
              </span>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded !bg-gray-200 !bg-opacity-75">
                  <div
                    style={{
                      width: `${(animal.kurban_status?.display_order * 10).toString()}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center !bg-indigo-700"
                  ></div>
                </div>
              </div>
              <p className="text-sm text-right opacity-90">
                Son Güncelleme:{" "}
                {new Date(animal.updated_at).toLocaleString("tr-TR")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
