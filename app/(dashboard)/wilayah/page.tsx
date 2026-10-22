import WilayahClientView from "./WilayahClientView";

export default function DataWilayahPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Data Wilayah Kecamatan & Desa
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola master data 15 Kecamatan dan Desa/Kelurahan se-Kabupaten Tapanuli Selatan
        </p>
      </div>

      <WilayahClientView />
    </div>
  );
}
