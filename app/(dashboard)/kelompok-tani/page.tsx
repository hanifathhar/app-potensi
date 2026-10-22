import KelompokTaniClientView from "./KelompokTaniClientView";

export default function KelompokTaniPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Data Kelompok Tani (Poktan)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manajemen data kelembagaan petani, peternak, dan pembudidaya ikan se-Kabupaten Tapanuli Selatan
        </p>
      </div>

      <KelompokTaniClientView />
    </div>
  );
}
