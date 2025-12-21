/**
 * OData Query Parser
 * Parses OData query parameters for filtering, sorting, pagination, and selection
 */

export interface ODataQuery {
  filter?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  select?: string[];
  count?: boolean;
  search?: string;
}

export interface ParsedODataQuery {
  where?: any;
  orderBy?: { [key: string]: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
  select?: string[];
  count?: boolean;
  search?: string;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'contains' | 'startswith' | 'endswith' | 'in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export class ODataParser {
  /**
   * Parse OData query string into structured query object
   */
  static parse(queryString: string): ParsedODataQuery {
    const params = new URLSearchParams(queryString);
    const result: ParsedODataQuery = {};

    // Parse $filter
    if (params.has('$filter')) {
      result.where = this.parseFilter(params.get('$filter')!);
    }

    // Parse $orderby
    if (params.has('$orderby')) {
      result.orderBy = this.parseOrderBy(params.get('$orderby')!);
    }

    // Parse $top
    if (params.has('$top')) {
      result.limit = parseInt(params.get('$top')!, 10);
    }

    // Parse $skip
    if (params.has('$skip')) {
      result.offset = parseInt(params.get('$skip')!, 10);
    }

    // Parse $select
    if (params.has('$select')) {
      result.select = params.get('$select')!.split(',').map(s => s.trim());
    }

    // Parse $count
    if (params.has('$count')) {
      result.count = params.get('$count')!.toLowerCase() === 'true';
    }

    // Parse $search
    if (params.has('$search')) {
      result.search = params.get('$search')!;
    }

    return result;
  }

  /**
   * Parse $filter expression into structured conditions
   */
  private static parseFilter(filterString: string): FilterCondition[] {
    const conditions: FilterCondition[] = [];
    
    // Split by 'and' and 'or' to handle multiple conditions
    const parts = filterString.split(/\s+(?:and|or)\s+/i);
    
    for (const part of parts) {
      // Match field operator value pattern
      const match = part.match(/^(\w+)\s+(eq|ne|gt|ge|lt|le|contains|startswith|endswith|in)\s+(.+)$/i);
      
      if (match) {
        const [, field, operator, value] = match;
        
        // Clean up the value
        let cleanValue = value.trim();
        
        // Handle quoted strings (both single and double quotes)
        if ((cleanValue.startsWith("'") && cleanValue.endsWith("'")) ||
            (cleanValue.startsWith('"') && cleanValue.endsWith('"'))) {
          cleanValue = cleanValue.slice(1, -1);
        }
        
        // Parse value based on type
        let parsedValue: any = cleanValue;
        
        // For 'in' operator, parse as array first
        if (operator.toLowerCase() === 'in') {
          // Handle quoted values in arrays
          const arrayValues = cleanValue.split(',').map(v => {
            const trimmed = v.trim();
            if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
                (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
              return trimmed.slice(1, -1);
            }
            return trimmed;
          });
          parsedValue = arrayValues;
        } else {
          // Try to parse as number
          if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
            parsedValue = Number(cleanValue);
          }
          // Try to parse as boolean
          else if (cleanValue.toLowerCase() === 'true' || cleanValue.toLowerCase() === 'false') {
            parsedValue = cleanValue.toLowerCase() === 'true';
          }
          // Try to parse as date
          else if (this.isDateString(cleanValue)) {
            parsedValue = new Date(cleanValue);
          }
          // Keep as string for other cases
        }

        conditions.push({
          field: field.trim(),
          operator: operator.toLowerCase() as FilterCondition['operator'],
          value: parsedValue
        });
      }
    }

    return conditions;
  }

  /**
   * Parse $orderby expression into structured order object
   */
  private static parseOrderBy(orderByString: string): { [key: string]: 'asc' | 'desc' } {
    const orderBy: { [key: string]: 'asc' | 'desc' } = {};
    
    const orderParts = orderByString.split(',');
    
    for (const part of orderParts) {
      const trimmed = part.trim();
      const spaceIndex = trimmed.lastIndexOf(' ');
      
      if (spaceIndex > 0) {
        const field = trimmed.substring(0, spaceIndex);
        const direction = trimmed.substring(spaceIndex + 1).toLowerCase();
        orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy[trimmed] = 'asc';
      }
    }

    return orderBy;
  }

  /**
   * Check if a string represents a date
   */
  private static isDateString(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('-');
  }

  /**
   * Apply OData query to a dataset
   */
  static applyQuery<T>(data: T[], query: ParsedODataQuery): { data: T[]; count?: number } {
    let result = [...data];

    // Apply search
    if (query.search) {
      result = this.applySearch(result, query.search);
    }

    // Apply filters
    if (query.where) {
      result = this.applyFilters(result, query.where);
    }

    // Apply sorting
    if (query.orderBy) {
      result = this.applySorting(result, query.orderBy);
    }

    // Apply pagination
    if (query.offset) {
      result = result.slice(query.offset);
    }
    if (query.limit) {
      result = result.slice(0, query.limit);
    }

    // Apply field selection
    if (query.select) {
      result = this.applySelection(result, query.select);
    }

    const response: { data: T[]; count?: number } = { data: result };

    if (query.count) {
      response.count = data.length;
    }

    return response;
  }

  /**
   * Apply search across all string fields
   */
  private static applySearch<T>(data: T[], searchTerm: string): T[] {
    const term = searchTerm.toLowerCase();
    
    return data.filter(item => {
      return Object.values(item as any).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        return false;
      });
    });
  }

  /**
   * Apply filter conditions to dataset
   */
  private static applyFilters<T>(data: T[], conditions: FilterCondition[]): T[] {
    return data.filter(item => {
      return conditions.every(condition => {
        const fieldValue = (item as any)[condition.field];
        
        switch (condition.operator) {
          case 'eq':
            return fieldValue === condition.value;
          case 'ne':
            return fieldValue !== condition.value;
          case 'gt':
            return fieldValue > condition.value;
          case 'ge':
            return fieldValue >= condition.value;
          case 'lt':
            return fieldValue < condition.value;
          case 'le':
            return fieldValue <= condition.value;
          case 'contains':
            return typeof fieldValue === 'string' && 
                   fieldValue.toLowerCase().includes(condition.value.toLowerCase());
          case 'startswith':
            return typeof fieldValue === 'string' && 
                   fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
          case 'endswith':
            return typeof fieldValue === 'string' && 
                   fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
          case 'in':
            return Array.isArray(condition.value) && 
                   condition.value.includes(fieldValue);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Apply sorting to dataset
   */
  private static applySorting<T>(data: T[], orderBy: { [key: string]: 'asc' | 'desc' }): T[] {
    return data.sort((a, b) => {
      for (const [field, direction] of Object.entries(orderBy)) {
        const aValue = (a as any)[field];
        const bValue = (b as any)[field];
        
        let comparison = 0;
        
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
        
        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      
      return 0;
    });
  }

  /**
   * Apply field selection to dataset
   */
  private static applySelection<T>(data: T[], select: string[]): T[] {
    return data.map(item => {
      const selected: any = {};
      for (const field of select) {
        if ((item as any).hasOwnProperty(field)) {
          selected[field] = (item as any)[field];
        }
      }
      return selected;
    });
  }
}

/**
 * Parse OData query parameters from URLSearchParams
 * This is a convenience function that wraps ODataParser.parse() and converts
 * the result to a format expected by API routes
 */
export function parseODataQuery(searchParams: URLSearchParams): {
  filter?: FilterCondition[];
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  top?: number;
  skip?: number;
  count?: boolean;
} {
  // Convert URLSearchParams to query string format
  const queryString = searchParams.toString();
  
  // Parse using ODataParser
  const parsed = ODataParser.parse(queryString);
  
  // Convert to expected format
  const result: {
    filter?: FilterCondition[];
    orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    top?: number;
    skip?: number;
    count?: boolean;
  } = {};
  
  // Convert where (FilterCondition[]) to filter
  if (parsed.where) {
    result.filter = parsed.where;
  }
  
  // Convert orderBy object to array
  if (parsed.orderBy) {
    result.orderBy = Object.entries(parsed.orderBy).map(([field, direction]) => ({
      field,
      direction
    }));
  }
  
  // Convert limit to top
  if (parsed.limit !== undefined) {
    result.top = parsed.limit;
  }
  
  // Convert offset to skip
  if (parsed.offset !== undefined) {
    result.skip = parsed.offset;
  }
  
  // Copy count
  if (parsed.count !== undefined) {
    result.count = parsed.count;
  }
  
  return result;
}
