/**
 * Integration tests for approval workflow with multiple provider types
 * Tests that approval logic correctly validates requirements from ALL assigned types
 */

import { checkAllRequiredRequirementsApproved } from '../../src/features/providers/lib/actions/administer-provider';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: mockPrisma,
}));

const mockPrisma = {
  provider: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  requirementSubmission: {
    update: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaClient;

// Test data
const gpRequirements = [
  { id: 'hpcsa-reg', name: 'HPCSA Registration', isRequired: true },
  { id: 'medical-degree', name: 'Medical Degree', isRequired: true },
  { id: 'medical-insurance', name: 'Medical Insurance', isRequired: true },
];

const psychRequirements = [
  { id: 'hpcsa-reg', name: 'HPCSA Registration', isRequired: true }, // Duplicate with GP
  { id: 'psych-degree', name: 'Psychology Degree', isRequired: true },
  { id: 'psych-license', name: 'Psychology License', isRequired: true },
];

const mockMultiTypeProvider = {
  id: 'provider-123',
  typeAssignments: [
    {
      providerType: {
        requirements: gpRequirements,
      },
    },
    {
      providerType: {
        requirements: psychRequirements,
      },
    },
  ],
  requirementSubmissions: [],
};

describe('Approval Workflow with Multiple Types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement Collection', () => {
    it('should collect requirements from all assigned provider types', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(mockMultiTypeProvider);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.totalRequired).toBe(5); // 3 GP + 3 Psych - 1 duplicate = 5 unique
      expect(result.data?.allRequiredApproved).toBe(false); // No approved submissions yet
    });

    it('should deduplicate requirements required by multiple types', async () => {
      const providerWithDuplicateRequirements = {
        ...mockMultiTypeProvider,
        typeAssignments: [
          {
            providerType: {
              requirements: [
                { id: 'hpcsa-reg', name: 'HPCSA Registration', isRequired: true },
                { id: 'insurance', name: 'Insurance', isRequired: true },
              ],
            },
          },
          {
            providerType: {
              requirements: [
                { id: 'hpcsa-reg', name: 'HPCSA Registration', isRequired: true }, // Duplicate
                { id: 'license', name: 'License', isRequired: true },
              ],
            },
          },
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithDuplicateRequirements);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.totalRequired).toBe(3); // hpcsa-reg (deduplicated), insurance, license
    });
  });

  describe('Approval Logic', () => {
    it('should require ALL unique requirements to be approved', async () => {
      const providerWithPartialApprovals = {
        ...mockMultiTypeProvider,
        requirementSubmissions: [
          {
            requirementTypeId: 'hpcsa-reg',
            status: 'APPROVED',
          },
          {
            requirementTypeId: 'medical-degree',
            status: 'APPROVED',
          },
          {
            requirementTypeId: 'medical-insurance',
            status: 'PENDING', // Not approved yet
          },
          // Missing psych-degree and psych-license submissions
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithPartialApprovals);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(false);
      expect(result.data?.totalApproved).toBe(2); // Only 2 approved submissions
      expect(result.data?.assignedTypes).toBe(2);
    });

    it('should approve when ALL requirements from ALL types are satisfied', async () => {
      const providerWithAllApprovals = {
        ...mockMultiTypeProvider,
        requirementSubmissions: [
          { requirementTypeId: 'hpcsa-reg', status: 'APPROVED' },
          { requirementTypeId: 'medical-degree', status: 'APPROVED' },
          { requirementTypeId: 'medical-insurance', status: 'APPROVED' },
          { requirementTypeId: 'psych-degree', status: 'APPROVED' },
          { requirementTypeId: 'psych-license', status: 'APPROVED' },
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithAllApprovals);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(true);
      expect(result.data?.totalApproved).toBe(5);
      expect(result.data?.totalRequired).toBe(5);
    });

    it('should handle rejected requirements correctly', async () => {
      const providerWithRejectedRequirement = {
        ...mockMultiTypeProvider,
        requirementSubmissions: [
          { requirementTypeId: 'hpcsa-reg', status: 'APPROVED' },
          { requirementTypeId: 'medical-degree', status: 'REJECTED' }, // Rejected
          { requirementTypeId: 'medical-insurance', status: 'APPROVED' },
          { requirementTypeId: 'psych-degree', status: 'APPROVED' },
          { requirementTypeId: 'psych-license', status: 'APPROVED' },
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithRejectedRequirement);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(false); // Still false due to rejected requirement
      expect(result.data?.totalApproved).toBe(4); // Only approved ones count
    });
  });

  describe('Provider Type Removal Scenarios', () => {
    it('should handle provider removing one type and resubmitting', async () => {
      // Provider starts with both GP and Psychologist types
      const initialProvider = mockMultiTypeProvider;
      
      // Provider removes Psychologist type, keeping only GP
      const modifiedProvider = {
        ...mockMultiTypeProvider,
        typeAssignments: [
          {
            providerType: {
              requirements: gpRequirements,
            },
          },
        ],
        requirementSubmissions: [
          { requirementTypeId: 'hpcsa-reg', status: 'APPROVED' },
          { requirementTypeId: 'medical-degree', status: 'APPROVED' },
          { requirementTypeId: 'medical-insurance', status: 'APPROVED' },
          // Psych requirements no longer needed
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(modifiedProvider);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(true); // Now approved with just GP requirements
      expect(result.data?.totalRequired).toBe(3); // Only GP requirements now
      expect(result.data?.assignedTypes).toBe(1);
    });

    it('should handle edge case of removing last provider type', async () => {
      const providerWithNoTypes = {
        ...mockMultiTypeProvider,
        typeAssignments: [], // No type assignments
        requirementSubmissions: [],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithNoTypes);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(true); // Vacuously true - no requirements needed
      expect(result.data?.totalRequired).toBe(0);
      expect(result.data?.assignedTypes).toBe(0);
    });
  });

  describe('Complex Multi-Type Scenarios', () => {
    it('should handle three different provider types', async () => {
      const tripleTypeProvider = {
        id: 'provider-123',
        typeAssignments: [
          {
            providerType: {
              requirements: [
                { id: 'req-1', name: 'Requirement 1', isRequired: true },
                { id: 'req-2', name: 'Requirement 2', isRequired: true },
              ],
            },
          },
          {
            providerType: {
              requirements: [
                { id: 'req-2', name: 'Requirement 2', isRequired: true }, // Duplicate
                { id: 'req-3', name: 'Requirement 3', isRequired: true },
              ],
            },
          },
          {
            providerType: {
              requirements: [
                { id: 'req-4', name: 'Requirement 4', isRequired: true },
                { id: 'req-5', name: 'Requirement 5', isRequired: true },
              ],
            },
          },
        ],
        requirementSubmissions: [
          { requirementTypeId: 'req-1', status: 'APPROVED' },
          { requirementTypeId: 'req-2', status: 'APPROVED' },
          { requirementTypeId: 'req-3', status: 'APPROVED' },
          { requirementTypeId: 'req-4', status: 'APPROVED' },
          { requirementTypeId: 'req-5', status: 'APPROVED' },
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(tripleTypeProvider);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(true);
      expect(result.data?.totalRequired).toBe(5); // req-1, req-2 (deduplicated), req-3, req-4, req-5
      expect(result.data?.assignedTypes).toBe(3);
    });

    it('should provide detailed pending requirements by type', async () => {
      const providerWithMixedApprovals = {
        ...mockMultiTypeProvider,
        requirementSubmissions: [
          { requirementTypeId: 'hpcsa-reg', status: 'APPROVED' },
          { requirementTypeId: 'medical-degree', status: 'PENDING' },
          // Missing: medical-insurance, psych-degree, psych-license
        ],
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(providerWithMixedApprovals);

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(false);
      
      // Should have pending requirements grouped by type
      // (Note: The actual implementation details depend on the function's return structure)
      expect(result.data?.totalApproved).toBe(1); // Only HPCSA approved
      expect(result.data?.totalRequired).toBe(5); // Total unique requirements
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent provider', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkAllRequiredRequirementsApproved('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle database errors gracefully', async () => {
      (mockPrisma.provider.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await checkAllRequiredRequirementsApproved('provider-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance with Large Numbers of Types', () => {
    it('should handle provider with many types efficiently', async () => {
      // Create provider with 10 different types, each with 5 requirements
      const manyTypesProvider = {
        id: 'provider-123',
        typeAssignments: Array.from({ length: 10 }, (_, i) => ({
          providerType: {
            requirements: Array.from({ length: 5 }, (_, j) => ({
              id: `req-${i}-${j}`,
              name: `Requirement ${i}-${j}`,
              isRequired: true,
            })),
          },
        })),
        requirementSubmissions: Array.from({ length: 50 }, (_, i) => ({
          requirementTypeId: `req-${Math.floor(i / 5)}-${i % 5}`,
          status: 'APPROVED',
        })),
      };

      (mockPrisma.provider.findUnique as jest.Mock).mockResolvedValue(manyTypesProvider);

      const startTime = Date.now();
      const result = await checkAllRequiredRequirementsApproved('provider-123');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data?.allRequiredApproved).toBe(true);
      expect(result.data?.totalRequired).toBe(50); // All unique requirements
      expect(result.data?.assignedTypes).toBe(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});