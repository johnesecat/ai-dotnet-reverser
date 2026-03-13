// src/search/global-search.ts

import type { Assembly, Type, Method } from '../types/assembly';

export class GlobalSearch {
  private index: SearchIndex = {
    types: [],
    methods: [],
    fields: []
  };

  buildIndex(assembly: Assembly): void {
    this.index = {
      types: [],
      methods: [],
      fields: []
    };

    // Index types
    assembly.types.forEach(type => {
      this.index.types.push({
        id: type.id,
        name: type.name,
        fullName: type.fullName,
        namespace: type.namespace,
        searchText: `${type.fullName} ${type.name}`.toLowerCase()
      });

      // Index methods
      type.methods.forEach(method => {
        this.index.methods.push({
          id: method.id,
          name: method.name,
          signature: method.signature,
          typeName: type.fullName,
          searchText: `${method.name} ${method.signature} ${type.fullName}`.toLowerCase()
        });
      });

      // Index fields
      type.fields.forEach(field => {
        this.index.fields.push({
          name: field.name,
          type: field.type,
          typeName: type.fullName,
          searchText: `${field.name} ${field.type} ${type.fullName}`.toLowerCase()
        });
      });
    });
  }

  search(query: string, options?: SearchOptions): SearchResults {
    const lowerQuery = query.toLowerCase();
    const maxResults = options?.maxResults || 50;

    const results: SearchResults = {
      types: [],
      methods: [],
      fields: []
    };

    // Search types
    if (!options?.types || options.types === true) {
      results.types = this.index.types
        .filter(t => t.searchText.includes(lowerQuery))
        .slice(0, maxResults)
        .map(t => ({
          id: t.id,
          name: t.name,
          fullName: t.fullName,
          matchType: 'name'
        }));
    }

    // Search methods
    if (!options?.methods || options.methods === true) {
      results.methods = this.index.methods
        .filter(m => m.searchText.includes(lowerQuery))
        .slice(0, maxResults)
        .map(m => ({
          id: m.id,
          name: m.name,
          signature: m.signature,
          typeName: m.typeName,
          matchType: 'name'
        }));
    }

    // Search fields
    if (!options?.fields || options.fields === true) {
      results.fields = this.index.fields
        .filter(f => f.searchText.includes(lowerQuery))
        .slice(0, maxResults)
        .map(f => ({
          name: f.name,
          type: f.type,
          typeName: f.typeName,
          matchType: 'name'
        }));
    }

    return results;
  }

  searchByPattern(pattern: RegExp): SearchResults {
    const results: SearchResults = {
      types: [],
      methods: [],
      fields: []
    };

    // Search types by regex
    results.types = this.index.types
      .filter(t => pattern.test(t.fullName))
      .map(t => ({
        id: t.id,
        name: t.name,
        fullName: t.fullName,
        matchType: 'pattern'
      }));

    // Search methods by regex
    results.methods = this.index.methods
      .filter(m => pattern.test(m.name) || pattern.test(m.signature))
      .map(m => ({
        id: m.id,
        name: m.name,
        signature: m.signature,
        typeName: m.typeName,
        matchType: 'pattern'
      }));

    return results;
  }
}

interface SearchIndex {
  types: Array<{
    id: string;
    name: string;
    fullName: string;
    namespace: string;
    searchText: string;
  }>;
  methods: Array<{
    id: string;
    name: string;
    signature: string;
    typeName: string;
    searchText: string;
  }>;
  fields: Array<{
    name: string;
    type: string;
    typeName: string;
    searchText: string;
  }>;
}

export interface SearchResults {
  types: Array<{
    id: string;
    name: string;
    fullName: string;
    matchType: string;
  }>;
  methods: Array<{
    id: string;
    name: string;
    signature: string;
    typeName: string;
    matchType: string;
  }>;
  fields: Array<{
    name: string;
    type: string;
    typeName: string;
    matchType: string;
  }>;
}

export interface SearchOptions {
  types?: boolean;
  methods?: boolean;
  fields?: boolean;
  maxResults?: number;
}