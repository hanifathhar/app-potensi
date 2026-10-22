import SiklusProduksiClientView from "./SiklusProduksiClientView";

export default function SiklusProduksiPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Siklus Produksi & Jadwal Panen
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Pencatatan dan monitoring jadwal tanam, tebar benih, pemeliharaan, serta jadwal estimasi panen komoditas
        </p>
      </div>

      <SiklusProduksiClientView />
    </div>
  );
}
