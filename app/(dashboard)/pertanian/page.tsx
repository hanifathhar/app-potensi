import PertanianClientView from "./PertanianClientView";

export default function PertanianPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Usaha Pertanian & Perkebunan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manajemen data usaha kebun komoditas kopi, jagung, padi, salak, karet, dan sawit se-Kabupaten Tapanuli Selatan
        </p>
      </div>

      <PertanianClientView />
    </div>
  );
}
