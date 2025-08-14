import { prisma } from './prisma';

export interface CreateLineData {
  name: string;
  code: string;
}

export interface UpdateLineData {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export const linesService = {
  // Get all lines
  async getAll() {
    try {
      const lines = await prisma.line.findMany({
        include: {
          _count: {
            select: {
              styleAssignments: true,
              productionEntries: true
            }
          }
        },
        orderBy: [
          { code: 'asc' }
        ]
      });
      return lines;
    } catch (error) {
      console.error('Error fetching lines:', error);
      throw new Error('Failed to fetch lines');
    }
  },

  // Get line by ID
  async getById(id: string) {
    try {
      const line = await prisma.line.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              styleAssignments: true,
              productionEntries: true
            }
          }
        }
      });
      return line;
    } catch (error) {
      console.error('Error fetching line:', error);
      throw new Error('Failed to fetch line');
    }
  },

  // Create new line
  async create(data: CreateLineData) {
    try {
      const line = await prisma.line.create({
        data
      });
      return line;
    } catch (error) {
      console.error('Error creating line:', error);
      throw new Error('Failed to create line');
    }
  },

  // Update line
  async update(id: string, data: UpdateLineData) {
    try {
      const line = await prisma.line.update({
        where: { id },
        data
      });
      return line;
    } catch (error) {
      console.error('Error updating line:', error);
      throw new Error('Failed to update line');
    }
  },

  // Delete line
  async delete(id: string) {
    try {
      const line = await prisma.line.delete({
        where: { id }
      });
      return line;
    } catch (error) {
      console.error('Error deleting line:', error);
      throw new Error('Failed to delete line');
    }
  },


};
