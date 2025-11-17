/**
 * Search Service Interface - ISP Compliant
 * Handles ONLY search and filtering operations
 */

export interface SearchQuery {
  term: string;
  fields?: string[]; // Specific fields to search in
  organizationId: string;
}

export interface SearchFilters {
  qrCodeLabels?: string[];
  deliveryStatus?: ('pending' | 'delivered' | 'failed')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customFields?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  highlightMatches?: boolean;
}

export interface SearchResult {
  id: string;
  score: number; // Relevance score
  highlights?: Record<string, string[]>; // Highlighted matching text
  data: any; // The actual registration data
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number; // Time taken in milliseconds
  suggestions?: string[]; // Search suggestions for typos
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  filters: SearchFilters;
  createdAt: Date;
  organizationId: string;
}

/**
 * Search Service - Focused ONLY on search operations
 * Following Interface Segregation Principle
 */
export interface ISearchService {
  /**
   * Perform full-text search across registrations
   */
  searchRegistrations(
    query: SearchQuery,
    filters?: SearchFilters,
    options?: SearchOptions
  ): Promise<SearchResponse>;

  /**
   * Get search suggestions based on partial input
   */
  getSearchSuggestions(
    partialQuery: string,
    organizationId: string
  ): Promise<string[]>;

  /**
   * Save a search query for later use
   */
  saveSearch(
    name: string,
    query: SearchQuery,
    filters: SearchFilters,
    organizationId: string
  ): Promise<SavedSearch>;

  /**
   * Get saved searches for an organization
   */
  getSavedSearches(organizationId: string): Promise<SavedSearch[]>;

  /**
   * Delete a saved search
   */
  deleteSavedSearch(id: string): Promise<boolean>;

  /**
   * Get popular search terms for an organization
   */
  getPopularSearchTerms(organizationId: string, limit?: number): Promise<string[]>;
}