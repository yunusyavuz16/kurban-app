import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kurban, user, status } from "../services/api";
import type { KurbanStatus, StatusPayload } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import KurbanOrderManager from "./KurbanOrderManager";

interface Animal {
  id: string;
  order_number: number;
  status: KurbanStatus;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  role: "admin" | "staff";
}

interface StatusFormState extends StatusPayload {
  id?: string;
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "staff">("staff");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState<StatusFormState>({
    id: undefined,
    name: '',
    label: '',
    color_bg: '!bg-gray-50',
    color_text: 'text-gray-900',
    color_border: 'border-gray-300',
    display_order: 100
  });
  const [statusError, setStatusError] = useState<string | null>(null);

  console.log("Current user from context:", currentUser); // Debug log

  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ["animals"],
    queryFn: kurban.getAll,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: user.getUsers,
  });

  const { data: kurbanStatuses, isLoading: isLoadingStatuses } = useQuery<KurbanStatus[]>({
    queryKey: ['statuses'],
    queryFn: status.getAll,
  });

  const createUserMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role: "admin" | "staff";
    }) => {
      const response = await user.register(email, password, role);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Kullanıcı listesini güncelle
      setNewUserEmail("");
      setNewUserPassword("");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      await user.deleteUser(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Kullanıcı listesini güncelle
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (formData: StatusFormState) => {
      setStatusError(null);
      const payload: StatusPayload = {
        name: formData.name,
        label: formData.label,
        color_bg: formData.color_bg,
        color_text: formData.color_text,
        color_border: formData.color_border,
        display_order: Number(formData.display_order) || 0,
      };
      if (formData.id) {
        return await status.update(formData.id, payload);
      } else {
        return await status.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      setIsStatusModalOpen(false);
      resetStatusForm();
    },
    onError: (error: any) => {
      console.error("Status save error:", error);
      setStatusError(error?.response?.data?.error || "Durum kaydedilirken bir hata oluştu.");
    }
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      setStatusError(null);
      return await status.delete(statusId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
    },
    onError: (error: any) => {
      console.error("Status delete error:", error);
      alert(error?.response?.data?.error || "Durum silinirken bir hata oluştu.");
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    });
  };

  const handleDeleteUser = (email: string) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
      deleteUserMutation.mutate(email);
    }
  };

  const openStatusModal = (status?: KurbanStatus) => {
    if (status) {
      setStatusForm({
        id: status.id,
        name: status.name,
        label: status.label,
        color_bg: status.color_bg,
        color_text: status.color_text,
        color_border: status.color_border,
        display_order: status.display_order,
      });
    } else {
      resetStatusForm();
    }
    setStatusError(null);
    setIsStatusModalOpen(true);
  };

  const resetStatusForm = () => {
    setStatusForm({
      id: undefined,
      name: '',
      label: '',
      color_bg: '!bg-gray-50',
      color_text: 'text-gray-900',
      color_border: 'border-gray-300',
      display_order: (kurbanStatuses?.length ?? 0) * 10 + 10
    });
  };

  const handleStatusFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStatusForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    statusMutation.mutate(statusForm);
  };

  const handleDeleteStatus = (statusId: string) => {
    if (window.confirm("Bu durumu silmek istediğinize emin misiniz? Bu durumu kullanan kurbanlar varsa işlem başarısız olacaktır.")) {
      deleteStatusMutation.mutate(statusId);
    }
  };

  if (isLoadingAnimals || isLoadingUsers || isLoadingStatuses) {
    return (
      <div className="flex items-center justify-center min-h-screen !bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const completedAnimals =
    animals?.filter((a) => a.status.name === "done").length || 0;
  const totalAnimals = animals?.length || 0;

  return (
    <div className="min-h-screen !bg-gray-50 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800">Yönetici Paneli</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="!bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-700">
            Toplam Kurban
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-blue-600">{totalAnimals}</p>
        </div>
        <div className="!bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-700">
            Tamamlanan
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-green-600">
            {completedAnimals}
          </p>
        </div>
        <div className="!bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-700">
            Devam Eden
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-orange-600">
            {totalAnimals - completedAnimals}
          </p>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <KurbanOrderManager />
      </div>

      <div className="!bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">
          Kullanıcı Yönetimi
        </h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="Email"
              className="p-2 sm:p-3 text-sm sm:text-base !bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
              disabled={createUserMutation.isPending}
            />
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Şifre"
              className="p-2 sm:p-3 text-sm sm:text-base !bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
              disabled={createUserMutation.isPending}
            />
            <select
              value={newUserRole}
              onChange={(e) =>
                setNewUserRole(e.target.value as "admin" | "staff")
              }
              className="p-2 sm:p-3 text-sm sm:text-base !bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={createUserMutation.isPending}
            >
              <option value="staff">Personel</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className={`relative w-full sm:w-auto !bg-blue-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg transition-all duration-200 font-semibold text-base sm:text-lg shadow-md
              ${
                createUserMutation.isPending
                  ? "!bg-blue-400 cursor-not-allowed"
                  : "hover:!bg-blue-700"
              }`}
          >
            <span
              className={`${
                createUserMutation.isPending ? "opacity-0" : "opacity-100"
              }`}
            >
              Kullanıcı Oluştur
            </span>
            {createUserMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          {createUserMutation.isError && (
            <p className="text-red-600 mt-2 text-sm sm:text-base">
              Kullanıcı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          )}
          {createUserMutation.isSuccess && (
            <p className="text-green-600 mt-2 text-sm sm:text-base">
              Kullanıcı başarıyla oluşturuldu!
            </p>
          )}
        </form>

        <div className="mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            Mevcut Kullanıcılar
          </h3>
          <div className="space-y-3">
            {users
              ?.filter((user) => user.email !== currentUser?.email)
              .map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 !bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-0"
                >
                  <span className="text-gray-700 font-medium text-sm sm:text-base break-all sm:break-normal">
                    {user.email}
                  </span>
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                    <span
                      className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold ${
                        user.role === "admin"
                          ? "!bg-purple-100 text-purple-700 border border-purple-200"
                          : "!bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {user.role === "admin" ? "Yönetici" : "Personel"}
                    </span>
                    <button
                      onClick={() => handleDeleteUser(user.email)}
                      className="px-2 py-1 sm:px-3 text-xs sm:text-sm !bg-red-100 text-red-700 hover:!bg-red-200 rounded-lg transition-colors duration-200"
                      disabled={deleteUserMutation.isPending && deleteUserMutation.variables === user.email}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="!bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">
            Durum Yönetimi
          </h2>
          <button
            onClick={() => openStatusModal()}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base font-medium text-white !bg-green-600 rounded-lg hover:!bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-md"
          >
            Yeni Durum Ekle
          </button>
        </div>

        <div className="space-y-3">
          {kurbanStatuses?.map((status) => (
            <div
              key={status.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 !bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-0"
            >
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border ${status.color_bg} ${status.color_text} ${status.color_border}`}>
                  {status.label}
                </span>
                <span className="text-gray-600 text-xs sm:text-sm">({status.name})</span>
                <span className="text-gray-500 text-xs sm:text-sm">Sıra: {status.display_order}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openStatusModal(status)}
                  className="px-2 py-1 sm:px-3 text-xs sm:text-sm !bg-yellow-100 text-yellow-800 hover:!bg-yellow-200 rounded-lg transition-colors duration-200"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDeleteStatus(status.id)}
                  className="px-2 py-1 sm:px-3 text-xs sm:text-sm !bg-red-100 text-red-700 hover:!bg-red-200 rounded-lg transition-colors duration-200"
                  disabled={deleteStatusMutation.isPending && deleteStatusMutation.variables === status.id}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
          {(!kurbanStatuses || kurbanStatuses.length === 0) && (
            <p className="text-center text-gray-500 py-4">Tanımlı durum bulunmamaktadır.</p>
          )}
        </div>
      </div>

      {isStatusModalOpen && (
        <div className="fixed inset-0 !bg-black !bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="!bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg transform transition-all">
            <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
              {statusForm.id ? 'Durumu Düzenle' : 'Yeni Durum Ekle'}
            </h3>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label htmlFor="label" className="block text-sm font-medium text-gray-700">Etiket (Görünür Ad)</label>
                <input type="text" name="label" id="label" value={statusForm.label} onChange={handleStatusFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">İsim (Teknik Ad - boşluksuz, ör: 'kesimde')</label>
                <input type="text" name="name" id="name" value={statusForm.name} onChange={handleStatusFormChange} required pattern="^[a-z_]+$" title="Sadece küçük harf ve alt çizgi" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">Görüntüleme Sırası</label>
                <input type="number" name="display_order" id="display_order" value={statusForm.display_order} onChange={handleStatusFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="color_bg" className="block text-sm font-medium text-gray-700">Arkaplan Rengi (Tailwind Sınıfı)</label>
                <input type="text" name="color_bg" id="color_bg" value={statusForm.color_bg} onChange={handleStatusFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="örn: !bg-red-50"/>
              </div>
              <div>
                <label htmlFor="color_text" className="block text-sm font-medium text-gray-700">Yazı Rengi (Tailwind Sınıfı)</label>
                <input type="text" name="color_text" id="color_text" value={statusForm.color_text} onChange={handleStatusFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="örn: text-red-900"/>
              </div>
              <div>
                <label htmlFor="color_border" className="block text-sm font-medium text-gray-700">Kenarlık Rengi (Tailwind Sınıfı)</label>
                <input type="text" name="color_border" id="color_border" value={statusForm.color_border} onChange={handleStatusFormChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="örn: border-red-300"/>
              </div>

              {statusError && <p className="text-red-600 text-sm">{statusError}</p>}

              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 !bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:!bg-gray-50">İptal</button>
                <button type="submit" disabled={statusMutation.isPending} className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm ${statusMutation.isPending ? '!bg-blue-400' : '!bg-blue-600 hover:!bg-blue-700'}`}> {statusMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
