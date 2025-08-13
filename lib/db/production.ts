import { ProductionStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { prisma } from './prisma';

// Define a proper error type for Prisma errors
interface PrismaError extends Error {
  code?: string;
}

export interface CreateProductionItemData {
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status?: ProductionStatus;
  notes?: string;
}

export interface UpdateProductionItemData {
  programCode?: string;
  buyer?: string;
  quantity?: number;
  item?: string;
  price?: number;
  status?: ProductionStatus;
  notes?: string;
}

// Interface for Prisma update data
interface PrismaUpdateData {
  programCode?: string;
  buyer?: string;
  quantity?: number;
  item?: string;
  price?: Decimal;
  status?: ProductionStatus;
  notes?: string;
}

// Helper function to convert Decimal to number
function convertDecimalToNumber(value: unknown): number | unknown {
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  return value;
}

// Helper function to transform production item data
function transformProductionItem(item: any) {
  return {
    ...item,
    price: convertDecimalToNumber(item.price)
  };
}

export const productionService = {
  // Get all production items
  async getAll() {
    try {
      const items = await prisma.productionList.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return items.map(transformProductionItem);
    } catch (error) {
      console.error('Error fetching production items:', error);
      throw new Error('Failed to fetch production items');
    }
  },

  // Get production item by ID
  async getById(id: string) {
    try {
      const item = await prisma.productionList.findUnique({
        where: { id }
      });
      return item ? transformProductionItem(item) : null;
    } catch (error) {
      console.error('Error fetching production item:', error);
      throw new Error('Failed to fetch production item');
    }
  },

  // Create new production item
  async create(data: CreateProductionItemData) {
    try {
      const item = await prisma.productionList.create({
        data: {
          ...data,
          price: new Decimal(data.price),
        }
      });
      return transformProductionItem(item);
    } catch (error) {
      console.error('Error creating production item:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new Error('Program code already exists');
      }
      throw new Error('Failed to create production item');
    }
  },

  // Update production item
  async update(id: string, data: UpdateProductionItemData) {
    try {
      const updateData: PrismaUpdateData = {};
      
      // Only assign defined values
      if (data.programCode !== undefined) updateData.programCode = data.programCode;
      if (data.buyer !== undefined) updateData.buyer = data.buyer;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.item !== undefined) updateData.item = data.item;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      if (data.price !== undefined) {
        updateData.price = new Decimal(data.price);
      }

      const item = await prisma.productionList.update({
        where: { id },
        data: updateData
      });
      return transformProductionItem(item);
    } catch (error) {
      console.error('Error updating production item:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new Error('Program code already exists');
      }
      if (prismaError.code === 'P2025') {
        throw new Error('Production item not found');
      }
      throw new Error('Failed to update production item');
    }
  },

  // Delete production item
  async delete(id: string) {
    try {
      const item = await prisma.productionList.delete({
        where: { id }
      });
      return transformProductionItem(item);
    } catch (error) {
      console.error('Error deleting production item:', error);
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new Error('Production item not found');
      }
      throw new Error('Failed to delete production item');
    }
  },

  // Check if program code exists
  async programCodeExists(programCode: string, excludeId?: string) {
    try {
      const where: { programCode: string; id?: { not: string } } = { programCode };
      if (excludeId) {
        where.id = { not: excludeId };
      }
      
      const existing = await prisma.productionList.findFirst({ where });
      return !!existing;
    } catch (error) {
      console.error('Error checking program code:', error);
      throw new Error('Failed to check program code');
    }
  },

  // Get production items by status
  async getByStatus(status: ProductionStatus | 'all') {
    try {
      if (status === 'all') {
        return await this.getAll();
      }
      
      const items = await prisma.productionList.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
      });
      return items.map(transformProductionItem);
    } catch (error) {
      console.error('Error fetching production items by status:', error);
      throw new Error('Failed to fetch production items by status');
    }
  }
};
