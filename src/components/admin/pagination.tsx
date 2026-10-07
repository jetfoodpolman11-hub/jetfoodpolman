"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  perPage,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalRecords === 0) {
    return null;
  }

  const rawPerPageParam = searchParams.get("perPage") || "";
  const isShowingAll =
    rawPerPageParam.toUpperCase() === "ALL" || perPage >= 5000;

  const startRecord = isShowingAll
    ? 1
    : Math.min((currentPage - 1) * perPage + 1, totalRecords);
  const endRecord = isShowingAll
    ? totalRecords
    : Math.min(currentPage * perPage, totalRecords);

  const goToPage = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleChangePerPage = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value === "10") {
      params.delete("perPage");
    } else {
      params.set("perPage", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build page numbers array (sliding window around currentPage)
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const selectValue = isShowingAll
    ? "ALL"
    : ["10", "25", "50", "100"].includes(String(perPage))
      ? String(perPage)
      : "10";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs">
      <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
        <div>
          Menampilkan{" "}
          <span className="font-bold text-slate-800">{startRecord}</span> -{" "}
          <span className="font-bold text-slate-800">{endRecord}</span> dari{" "}
          <span className="font-bold text-slate-800">{totalRecords}</span> baris
        </div>

        <div className="flex items-center gap-1.5">
          <ListFilter className="h-3.5 w-3.5 text-slate-400" />
          <label htmlFor="pagination-per-page" className="text-slate-500 font-medium">
            Tampilkan:
          </label>
          <select
            id="pagination-per-page"
            value={selectValue}
            onChange={(e) => handleChangePerPage(e.target.value)}
            className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-800 focus:border-[#DC0000] focus:outline-none cursor-pointer"
          >
            <option value="10">1 - 10 Baris</option>
            <option value="25">25 Baris</option>
            <option value="50">50 Baris</option>
            <option value="100">100 Baris</option>
            <option value="ALL">Semua Baris ({totalRecords})</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {!isShowingAll && totalRecords > perPage && (
          <button
            type="button"
            onClick={() => handleChangePerPage("ALL")}
            className="h-8 px-2.5 rounded-lg border border-red-200 bg-red-50 text-[#DC0000] hover:bg-red-100 font-bold text-[11px] transition-colors cursor-pointer mr-1"
          >
            Lihat Semua Baris ({totalRecords})
          </button>
        )}

        {isShowingAll && totalRecords > 10 && (
          <button
            type="button"
            onClick={() => handleChangePerPage("10")}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
          >
            Tampilkan 1 - 10 per Halaman
          </button>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pages.map((p) => {
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-colors ${
                    isCurrent
                      ? "bg-[#DC0000] text-white shadow-xs"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
