import { ProductionStatus, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { prisma } from './prisma';

export interface QuantityItem {
  variant: string;
  color: string;
  qty: number;
}

export interface CreateProductionItemData {
  programCode: string;
  styleNo: string;
  buyer: string;
  quantities: QuantityItem[];
  totalQty: number;
  item: string;
  price: number;
  percentage: number;
  status?: ProductionStatus;
}

export interface UpdateProductionItemData {
  programCode?: string;
  styleNo?: string;
  buyer?: string;
  quantities?: QuantityItem[];
  totalQty?: number;
  item?: string;
  price?: number;
  percentage?: number;
  status?: ProductionStatus;
}

// Interface for Prisma update data
interface PrismaUpdateData {
  programCode?: string;
  styleNo?: string;
  buyer?: string;
  quantities?: Prisma.InputJsonValue;
  totalQty?: number;
  item?: string;
  price?: Decimal;
  percentage?: Decimal;
  status?: ProductionStatus;
}

// Helper function to convert Decimal to number
function convertDecimalToNumber(value: unknown): number | unknown {
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return value;
}

// Helper function to transform production item data
function transformProductionItem(item: Record<string, unknown>) {
  return {
    ...item,
    price: convertDecimalToNumber(item.price),
    percentage: convertDecimalToNumber(item.percentage),
    quantities: Array.isArray(item.quantities) ? item.quantities : []
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
          percentage: new Decimal(data.percentage),
          quantities: JSON.parse(JSON.stringify(data.quantities)),
        }
      });
      return transformProductionItem(item);
    } catch (error) {
      console.error('Error creating production item:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.message.includes('styleNo')) {
            throw new Error('Style No already exists');
          }
          throw new Error('Failed to create production item');
        }
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
      if (data.styleNo !== undefined) updateData.styleNo = data.styleNo;
      if (data.buyer !== undefined) updateData.buyer = data.buyer;
      if (data.quantities !== undefined) updateData.quantities = JSON.parse(JSON.stringify(data.quantities));
      if (data.totalQty !== undefined) updateData.totalQty = data.totalQty;
      if (data.item !== undefined) updateData.item = data.item;
      if (data.status !== undefined) updateData.status = data.status;
      
      if (data.price !== undefined) {
        updateData.price = new Decimal(data.price);
      }
      
      if (data.percentage !== undefined) {
        updateData.percentage = new Decimal(data.percentage);
      }

      const item = await prisma.productionList.update({
        where: { id },
        data: updateData
      });
      return transformProductionItem(item);
    } catch (error) {
      console.error('Error updating production item:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.message.includes('styleNo')) {
            throw new Error('Style No already exists. Please use a different style number.');
          }
          throw new Error('Duplicate entry error. Please check your data.');
        }
        
        if (error.code === 'P2025') {
          throw new Error('Production item not found. The item may have been deleted.');
        }
        
        if (error.code === 'P2003') {
          throw new Error('Foreign key constraint failed. Please check referenced data.');
        }
        
        // Log the actual error for debugging
        console.error('Prisma error details:', {
          code: error.code,
          message: error.message,
          meta: error.meta
        });
        
        throw new Error(`Failed to update production item: ${error.message || 'Unknown database error'}`);
      }
      
      throw new Error(`Failed to update production item: ${error instanceof Error ? error.message : 'Unknown database error'}`);
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Production item not found');
        }
      }
      throw new Error('Failed to delete production item');
    }
  },

  // Check if style number exists
  async styleNoExists(styleNo: string, excludeId?: string) {
    try {
      const where: { styleNo: string; id?: { not: string } } = { styleNo };
      if (excludeId) {
        where.id = { not: excludeId };
      }
      
      const existing = await prisma.productionList.findFirst({ where });
      return !!existing;
    } catch (error) {
      console.error('Error checking style number:', error);
      throw new Error('Failed to check style number');
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