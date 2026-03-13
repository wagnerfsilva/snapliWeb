import { create } from 'zustand';

export const useSearchStore = create((set) => ({
    searchResults: [],
    isSearching: false,
    searchError: null,
    uploadedImage: null,

    setSearchResults: (results) => set({ searchResults: results }),
    setIsSearching: (status) => set({ isSearching: status }),
    setSearchError: (error) => set({ searchError: error }),
    setUploadedImage: (image) => set({ uploadedImage: image }),

    clearSearch: () => set({
        searchResults: [],
        isSearching: false,
        searchError: null,
        uploadedImage: null,
    }),
}));
