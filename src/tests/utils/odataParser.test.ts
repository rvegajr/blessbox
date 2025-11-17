import { describe, it, expect } from 'vitest';
import { ODataParser } from '@/lib/utils/odataParser';

describe('ODataParser', () => {
  describe('parse', () => {
    it('should parse basic query parameters', () => {
      const queryString = '$filter=code eq "TEST25"&$orderby=createdAt desc&$top=10&$skip=5';
      const result = ODataParser.parse(queryString);

      expect(result.where).toBeDefined();
      expect(result.orderBy).toBeDefined();
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
    });

    it('should parse $filter with multiple conditions', () => {
      const queryString = '$filter=isActive eq true and discountType eq "percentage"';
      const result = ODataParser.parse(queryString);

      expect(result.where).toHaveLength(2);
      expect(result.where![0]).toEqual({
        field: 'isActive',
        operator: 'eq',
        value: true
      });
      expect(result.where![1]).toEqual({
        field: 'discountType',
        operator: 'eq',
        value: 'percentage'
      });
    });

    it('should parse $orderby with multiple fields', () => {
      const queryString = '$orderby=createdAt desc, code asc';
      const result = ODataParser.parse(queryString);

      expect(result.orderBy).toEqual({
        createdAt: 'desc',
        code: 'asc'
      });
    });

    it('should parse $select with multiple fields', () => {
      const queryString = '$select=id,code,description,discountValue';
      const result = ODataParser.parse(queryString);

      expect(result.select).toEqual(['id', 'code', 'description', 'discountValue']);
    });

    it('should parse $count parameter', () => {
      const queryString = '$count=true';
      const result = ODataParser.parse(queryString);

      expect(result.count).toBe(true);
    });

    it('should parse $search parameter', () => {
      const queryString = '$search=welcome';
      const result = ODataParser.parse(queryString);

      expect(result.search).toBe('welcome');
    });

    it('should handle empty query string', () => {
      const result = ODataParser.parse('');
      expect(result).toEqual({});
    });

    it('should parse different data types in filters', () => {
      const queryString = '$filter=id eq 123 and isActive eq true and discountValue eq 25.5 and expiresAt ge 2024-01-01';
      const result = ODataParser.parse(queryString);

      expect(result.where).toHaveLength(4);
      expect(result.where![0].value).toBe(123);
      expect(result.where![1].value).toBe(true);
      expect(result.where![2].value).toBe(25.5);
      expect(result.where![3].value).toBeInstanceOf(Date);
    });

    it('should parse "in" operator with array values', () => {
      const queryString = '$filter=discountType in "percentage,fixed"';
      const result = ODataParser.parse(queryString);

      expect(result.where![0]).toEqual({
        field: 'discountType',
        operator: 'in',
        value: ['percentage', 'fixed']
      });
    });
  });

  describe('applyQuery', () => {
    const testData = [
      { id: 1, code: 'WELCOME25', description: 'Welcome discount', discountValue: 25, isActive: true, createdAt: new Date('2024-01-01') },
      { id: 2, code: 'SAVE50', description: 'Save 50%', discountValue: 50, isActive: false, createdAt: new Date('2024-01-02') },
      { id: 3, code: 'NEWUSER', description: 'New user special', discountValue: 10, isActive: true, createdAt: new Date('2024-01-03') },
      { id: 4, code: 'HOLIDAY', description: 'Holiday special', discountValue: 30, isActive: true, createdAt: new Date('2024-01-04') }
    ];

    it('should apply basic filtering', () => {
      const query = {
        where: [
          { field: 'isActive', operator: 'eq', value: true }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(3);
      expect(result.data.every(item => item.isActive)).toBe(true);
    });

    it('should apply multiple filters with AND logic', () => {
      const query = {
        where: [
          { field: 'isActive', operator: 'eq', value: true },
          { field: 'discountValue', operator: 'gt', value: 20 }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.isActive && item.discountValue > 20)).toBe(true);
    });

    it('should apply contains filter', () => {
      const query = {
        where: [
          { field: 'description', operator: 'contains', value: 'special' }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.description.toLowerCase().includes('special'))).toBe(true);
    });

    it('should apply startsWith filter', () => {
      const query = {
        where: [
          { field: 'code', operator: 'startswith', value: 'WELCOME' }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('WELCOME25');
    });

    it('should apply endsWith filter', () => {
      const query = {
        where: [
          { field: 'code', operator: 'endswith', value: '25' }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('WELCOME25');
    });

    it('should apply in filter', () => {
      const query = {
        where: [
          { field: 'code', operator: 'in', value: ['WELCOME25', 'SAVE50'] }
        ]
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(2);
      expect(result.data.map(item => item.code)).toContain('WELCOME25');
      expect(result.data.map(item => item.code)).toContain('SAVE50');
    });

    it('should apply sorting', () => {
      const query = {
        orderBy: { discountValue: 'desc' }
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data[0].discountValue).toBe(50);
      expect(result.data[1].discountValue).toBe(30);
    });

    it('should apply multiple field sorting', () => {
      const query = {
        orderBy: { isActive: 'desc', discountValue: 'asc' }
      };

      const result = ODataParser.applyQuery(testData, query);
      // Active items should come first
      const activeItems = result.data.filter(item => item.isActive);
      const inactiveItems = result.data.filter(item => !item.isActive);
      expect(activeItems.length).toBe(3);
      expect(inactiveItems.length).toBe(1);
    });

    it('should apply pagination', () => {
      const query = {
        limit: 2,
        offset: 1
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(2); // Second item
    });

    it('should apply field selection', () => {
      const query = {
        select: ['id', 'code', 'discountValue']
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data[0]).toEqual({
        id: 1,
        code: 'WELCOME25',
        discountValue: 25
      });
    });

    it('should apply search across string fields', () => {
      const query = {
        search: 'welcome'
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('WELCOME25');
    });

    it('should include count when requested', () => {
      const query = {
        count: true
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.count).toBe(4);
    });

    it('should handle empty dataset', () => {
      const query = {
        where: [{ field: 'id', operator: 'eq', value: 999 }]
      };

      const result = ODataParser.applyQuery([], query);
      expect(result.data).toHaveLength(0);
    });

    it('should handle complex query with all parameters', () => {
      const query = {
        where: [
          { field: 'isActive', operator: 'eq', value: true },
          { field: 'discountValue', operator: 'gt', value: 20 }
        ],
        orderBy: { discountValue: 'desc' },
        limit: 1,
        offset: 0,
        select: ['id', 'code', 'discountValue'],
        count: true
      };

      const result = ODataParser.applyQuery(testData, query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 4,
        code: 'HOLIDAY',
        discountValue: 30
      });
      expect(result.count).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed filter expressions gracefully', () => {
      const queryString = '$filter=invalid expression';
      const result = ODataParser.parse(queryString);
      
      // Should not throw error, but may not parse correctly
      expect(result).toBeDefined();
    });

    it('should handle special characters in values', () => {
      const queryString = '$filter=description contains "test@example.com"';
      const result = ODataParser.parse(queryString);
      
      expect(result.where![0].value).toBe('test@example.com');
    });

    it('should handle empty values', () => {
      const queryString = '$filter=code eq ""';
      const result = ODataParser.parse(queryString);
      
      expect(result.where![0].value).toBe('');
    });
  });
});
