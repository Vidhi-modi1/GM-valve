import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "./ui/pagination";
import { Button } from "./ui/button";

type Props = {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  onChangePage: (page: number) => void;
  onChangePerPage?: (per: number) => void;
  disabled?: boolean;
};

export function TablePagination({
  page,
  perPage,
  total,
  lastPage,
  onChangePage,
  onChangePerPage,
  disabled,
}: Props) {
  const canPrev = page > 1;
  const canNext = page < Math.max(lastPage, 1);
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Page {page} of {Math.max(lastPage, 1)} • Total {total}</div>
      <div className="flex items-center gap-3">
        {onChangePerPage && (
          <select
            value={perPage}
            onChange={(e) => { onChangePage(1); onChangePerPage(Number(e.target.value)); }}
            className="border rounded px-2 py-1 text-sm"
            disabled={disabled}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        )}
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (canPrev) onChangePage(page - 1); }}
                aria-disabled={!canPrev}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (canNext) onChangePage(page + 1); }}
                aria-disabled={!canNext}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default TablePagination;
