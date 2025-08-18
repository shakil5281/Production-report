
import { prisma } from './prisma';

// Define a proper error type for Prisma errors
interface PrismaError extends Error {
  code?: string;
}

export interface CreateTargetData {
  lineNo: string;
  styleNo: string;
  lineTarget: number;
  date: string;
  inTime: string;
  outTime: string;
  hourlyProduction: number;
}

export interface UpdateTargetData {
  lineNo?: string;
  styleNo?: string;
  lineTarget?: number;
  date?: string;
  inTime?: string;
  outTime?: string;
  hourlyProduction?: number;
}

// Interface for Prisma update data
interface PrismaUpdateData {
  lineNo?: string;
  styleNo?: string;
  lineTarget?: number;
  date?: Date;
  inTime?: string;
  outTime?: string;
  hourlyProduction?: number;
}

// Helper function to convert Decimal to number
function convertDecimalToNumber(value: unknown): number | unknown {
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return value;
}

// Helper function to transform target data
function transformTarget(target: Record<string, unknown>) {
  return {
    ...target,
    averageProduction: convertDecimalToNumber(target.averageProduction)
  };
}

export const targetService = {
  // Get all targets
  async getAll() {
    try {
      const targets = await prisma.target.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          productionList: true
        }
      });
      return targets.map(transformTarget);
    } catch (error) {
      console.error('Error fetching targets:', error);
      throw new Error('Failed to fetch targets');
    }
  },

  // Get target by ID
  async getById(id: string) {
    try {
      const target = await prisma.target.findUnique({
        where: { id },
        include: {
          productionList: true
        }
      });
      return target ? transformTarget(target) : null;
    } catch (error) {
      console.error('Error fetching target:', error);
      throw new Error('Failed to fetch target');
    }
  },

  // Create new target
  async create(data: CreateTargetData) {
    try {
      // Parse the date string and create a local date object to avoid timezone issues
      const [year, month, day] = data.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);

      const target = await prisma.target.create({
        data: {
          ...data,
          date: localDate,
        },
        include: {
          productionList: true
        }
      });
      return transformTarget(target);
    } catch (error) {
      console.error('Error creating target:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new Error('Target already exists');
      }
      throw new Error('Failed to create target');
    }
  },

  // Update target
  async update(id: string, data: UpdateTargetData) {
    try {
      const updateData: PrismaUpdateData = {};
      
      // Only assign defined values
      if (data.lineNo !== undefined) updateData.lineNo = data.lineNo;
      if (data.styleNo !== undefined) updateData.styleNo = data.styleNo;
      if (data.lineTarget !== undefined) updateData.lineTarget = data.lineTarget;
      if (data.hourlyProduction !== undefined) updateData.hourlyProduction = data.hourlyProduction;
      
      if (data.date !== undefined) {
        // Parse the date string and create a local date object to avoid timezone issues
        const [year, month, day] = data.date.split('-').map(Number);
        updateData.date = new Date(year, month - 1, day);
      }
      
      if (data.inTime !== undefined) {
        updateData.inTime = data.inTime;
      }
      
      if (data.outTime !== undefined) {
        updateData.outTime = data.outTime;
      }

      const target = await prisma.target.update({
        where: { id },
        data: updateData,
        include: {
          productionList: true
        }
      });
      return transformTarget(target);
    } catch (error) {
      console.error('Error updating target:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new Error('Target not found');
      }
      throw new Error('Failed to update target');
    }
  },

  // Delete target
  async delete(id: string) {
    try {
      const target = await prisma.target.delete({
        where: { id },
        include: {
          productionList: true
        }
      });
      return transformTarget(target);
    } catch (error) {
      console.error('Error deleting target:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new Error('Target not found');
      }
      throw new Error('Failed to delete target');
    }
  },

  // Get targets by line number
  async getByLineNo(lineNo: string) {
    try {
      const targets = await prisma.target.findMany({
        where: { lineNo },
        orderBy: { createdAt: 'desc' },
        include: {
          productionList: true
        }
      });
      return targets.map(transformTarget);
    } catch (error) {
      console.error('Error fetching targets by line:', error);
      throw new Error('Failed to fetch targets by line');
    }
  },

  // Get targets by style number
  async getByStyleNo(styleNo: string) {
    try {
      const targets = await prisma.target.findMany({
        where: { styleNo },
        orderBy: { createdAt: 'desc' },
        include: {
          productionList: true
        }
      });
      return targets.map(transformTarget);
    } catch (error) {
      console.error('Error fetching targets by style:', error);
      throw new Error('Failed to fetch targets by style');
    }
  },

  // Get targets by date
  async getByDate(date: string) {
    try {
      // Parse the date string and create local date objects to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      const targets = await prisma.target.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          productionList: true
        }
      });
      return targets.map(transformTarget);
    } catch (error) {
      console.error('Error fetching targets by date:', error);
      throw new Error('Failed to fetch targets by date');
    }
  },

  // Get filtered and paginated targets
  async getFilteredPaginated({
    filters,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }: {
    filters: {
      date?: string;
      lineNo?: string;
      styleNo?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
    };
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    try {
      const where: Record<string, any> = {};

      // Apply filters
      if (filters.date) {
        const [year, month, day] = filters.date.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.date = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      if (filters.lineNo) {
        where.lineNo = {
          contains: filters.lineNo,
          mode: 'insensitive'
        };
      }

      if (filters.styleNo) {
        where.styleNo = {
          contains: filters.styleNo,
          mode: 'insensitive'
        };
      }

      if (filters.search) {
        where.OR = [
          { lineNo: { contains: filters.search, mode: 'insensitive' } },
          { styleNo: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        where.date = where.date || {};
        if (filters.dateFrom) {
          const [year, month, day] = filters.dateFrom.split('-').map(Number);
          where.date.gte = new Date(year, month - 1, day, 0, 0, 0, 0);
        }
        if (filters.dateTo) {
          const [year, month, day] = filters.dateTo.split('-').map(Number);
          where.date.lte = new Date(year, month - 1, day, 23, 59, 59, 999);
        }
      }

      // Get total count
      const total = await prisma.target.count({ where });

      // Get paginated targets
      const targets = await prisma.target.findMany({
        where,
        include: {
          productionList: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        targets: targets.map(transformTarget),
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching filtered targets:', error);
      throw new Error('Failed to fetch filtered targets');
    }
  },

  // Get target summary statistics
  async getStats() {
    try {
      const total = await prisma.target.count();
      
      const totalTargetSum = await prisma.target.aggregate({
        _sum: {
          lineTarget: true,
          hourlyProduction: true
        },
        _avg: {
          lineTarget: true,
          hourlyProduction: true
        }
      });

      // Get targets by date range (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTargets = await prisma.target.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      return {
        total,
        recentTargets,
        totalLineTarget: totalTargetSum._sum.lineTarget || 0,
        totalHourlyProduction: totalTargetSum._sum.hourlyProduction || 0,
        avgLineTarget: Math.round((totalTargetSum._avg.lineTarget || 0) * 100) / 100,
        avgHourlyProduction: Math.round((totalTargetSum._avg.hourlyProduction || 0) * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching target stats:', error);
      throw new Error('Failed to fetch target stats');
    }
  }
};
