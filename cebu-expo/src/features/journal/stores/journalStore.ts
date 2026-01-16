/**
 * Input: Journal list state and pagination parameters
 * Output: Zustand store for journal list management
 * Pos: Manages journal list state, filters, and pagination
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { create } from 'zustand';

export interface JournalFilters {
  searchQuery: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  hasAudio: boolean | null;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
}

interface JournalState {
  // Filters
  filters: JournalFilters;
  setSearchQuery: (query: string) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setHasAudioFilter: (hasAudio: boolean | null) => void;
  clearFilters: () => void;

  // Pagination
  pagination: PaginationState;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  resetPagination: () => void;

  // UI State
  isRefreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;

  selectedEntryId: string | null;
  setSelectedEntryId: (id: string | null) => void;
}

const DEFAULT_PAGE_SIZE = 20;

export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial filters
  filters: {
    searchQuery: '',
    dateFrom: null,
    dateTo: null,
    hasAudio: null,
  },

  setSearchQuery: (query: string) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    }));
    get().resetPagination();
  },

  setDateRange: (from: Date | null, to: Date | null) => {
    set((state) => ({
      filters: { ...state.filters, dateFrom: from, dateTo: to },
    }));
    get().resetPagination();
  },

  setHasAudioFilter: (hasAudio: boolean | null) => {
    set((state) => ({
      filters: { ...state.filters, hasAudio },
    }));
    get().resetPagination();
  },

  clearFilters: () => {
    set({
      filters: {
        searchQuery: '',
        dateFrom: null,
        dateTo: null,
        hasAudio: null,
      },
    });
    get().resetPagination();
  },

  // Initial pagination
  pagination: {
    currentPage: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    hasMore: true,
  },

  setPage: (page: number) => {
    set((state) => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  },

  setHasMore: (hasMore: boolean) => {
    set((state) => ({
      pagination: { ...state.pagination, hasMore },
    }));
  },

  resetPagination: () => {
    set({
      pagination: {
        currentPage: 0,
        pageSize: DEFAULT_PAGE_SIZE,
        hasMore: true,
      },
    });
  },

  // UI state
  isRefreshing: false,
  setRefreshing: (refreshing: boolean) => {
    set({ isRefreshing: refreshing });
  },

  selectedEntryId: null,
  setSelectedEntryId: (id: string | null) => {
    set({ selectedEntryId: id });
  },
}));
