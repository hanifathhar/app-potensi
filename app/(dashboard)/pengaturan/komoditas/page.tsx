import KomoditasClientView from "./KomoditasClientView";
import { Sprout } from "lucide-react";

export default function MasterKomoditasPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sprout className="text-emerald-600" size={26} />
            Master Komoditas Unggulan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan katalog komoditas unggulan pertanian, perikanan, dan peternakan Kabupaten Tapanuli Selatan
          </p>
        </div>
      </div>

      <KomoditasClientView />
    </div>
  );
}
