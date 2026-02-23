/**
 * ATTRIBUTE SERVICE - ALL IN ONE
 * Handles AttributeSets, Attributes, and AttributeValues
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttributeSetDto,
  CreateAttributeDto,
  CreateAttributeValueDto,
} from './dto/attribute.dto';

@Injectable()
export class AttributeService {
  private readonly logger = new Logger(AttributeService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // ========================================
  // ATTRIBUTE SET METHODS
  // ========================================

  /**
   * Create Attribute Set
   */
  async createSet(dto: CreateAttributeSetDto, createdBy: string) {
    const slug = dto.slug || this.generateSlug(dto.name);

    const exists = await this.prisma.attributeSet.findUnique({
      where: { slug },
    });

    if (exists) {
      throw new ConflictException(`Slug "${slug}" already exists`);
    }

    const attributeSet = await this.prisma.attributeSet.create({
      data: {
        name: dto.name,
        slug,
        sortOrder: dto.sortOrder || 0,
        createdBy,
      },
    });

    this.logger.log(`Attribute set created: ${attributeSet.name}`);

    return {
      message: 'Attribute set created successfully',
      data: attributeSet,
    };
  }

  /**
   * Get All Attribute Sets with Relations
   */
  async getAllSets() {
    const attributeSets = await this.prisma.attributeSet.findMany({
      where: { isDeleted: false },
      include: {
        attributes: {
          where: { isDeleted: false },
          include: {
            values: {
              where: { isDeleted: false },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      message: 'Attribute sets retrieved successfully',
      data: attributeSets,
    };
  }

  /**
   * Get Attribute Set by ID
   */
  async getSetById(id: string) {
    const attributeSet = await this.prisma.attributeSet.findFirst({
      where: { id, isDeleted: false },
      include: {
        attributes: {
          where: { isDeleted: false },
          include: {
            values: {
              where: { isDeleted: false },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!attributeSet) {
      throw new NotFoundException('Attribute set not found');
    }

    return {
      message: 'Attribute set retrieved successfully',
      data: attributeSet,
    };
  }

  /**
   * Get Attribute Set by Slug
   */
  async getSetBySlug(slug: string) {
    const attributeSet = await this.prisma.attributeSet.findFirst({
      where: { slug, isDeleted: false },
      include: {
        attributes: {
          where: { isDeleted: false },
          include: {
            values: {
              where: { isDeleted: false },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!attributeSet) {
      throw new NotFoundException('Attribute set not found');
    }

    return {
      message: 'Attribute set retrieved successfully',
      data: attributeSet,
    };
  }

  /**
   * Delete Attribute Set
   */
  async deleteSet(id: string) {
    const attributeSet = await this.prisma.attributeSet.findFirst({
      where: { id, isDeleted: false },
    });

    if (!attributeSet) {
      throw new NotFoundException('Attribute set not found');
    }

    const deleted = await this.prisma.attributeSet.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Attribute set deleted: ${deleted.name}`);

    return {
      message: 'Attribute set deleted successfully',
      data: deleted,
    };
  }

  // ========================================
  // ATTRIBUTE METHODS
  // ========================================

  /**
   * Create Attribute
   */
  async createAttribute(dto: CreateAttributeDto, createdBy: string) {
    const attributeSet = await this.prisma.attributeSet.findFirst({
      where: { id: dto.attributeSetId, isDeleted: false },
    });

    if (!attributeSet) {
      throw new BadRequestException('Attribute set not found');
    }

    const slug = dto.slug || this.generateSlug(dto.name);

    const exists = await this.prisma.attribute.findFirst({
      where: {
        slug,
        attributeSetId: dto.attributeSetId,
        isDeleted: false,
      },
    });

    if (exists) {
      throw new ConflictException(`Slug "${slug}" already exists in this set`);
    }

    const attribute = await this.prisma.attribute.create({
      data: {
        name: dto.name,
        slug,
        attributeSetId: dto.attributeSetId,
        sortOrder: dto.sortOrder || 0,
        createdBy,
      },
    });

    this.logger.log(`Attribute created: ${attribute.name}`);

    return {
      message: 'Attribute created successfully',
      data: attribute,
    };
  }

  /**
   * Get Attributes by Set ID
   */
  async getAttributesBySet(attributeSetId: string) {
    const attributes = await this.prisma.attribute.findMany({
      where: { attributeSetId, isDeleted: false },
      include: {
        values: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      message: 'Attributes retrieved successfully',
      data: attributes,
    };
  }

  /**
   * Get Attribute by ID
   */
  async getAttributeById(id: string) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, isDeleted: false },
      include: {
        values: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        attributeSet: true,
      },
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return {
      message: 'Attribute retrieved successfully',
      data: attribute,
    };
  }

  /**
   * Get Attribute by Slug
   */
  async getAttributeBySlug(attributeSetId: string, slug: string) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { attributeSetId, slug, isDeleted: false },
      include: {
        values: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
        attributeSet: true,
      },
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return {
      message: 'Attribute retrieved successfully',
      data: attribute,
    };
  }

  /**
   * Delete Attribute
   */
  async deleteAttribute(id: string) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, isDeleted: false },
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    const deleted = await this.prisma.attribute.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Attribute deleted: ${deleted.name}`);

    return {
      message: 'Attribute deleted successfully',
      data: deleted,
    };
  }

  // ========================================
  // ATTRIBUTE VALUE METHODS
  // ========================================

  /**
   * Create Attribute Value
   */
  async createValue(dto: CreateAttributeValueDto, createdBy: string) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id: dto.attributeId, isDeleted: false },
    });

    if (!attribute) {
      throw new BadRequestException('Attribute not found');
    }

    const value = await this.prisma.attributeValue.create({
      data: {
        value: dto.value,
        attributeId: dto.attributeId,
        sortOrder: dto.sortOrder || 0,
        createdBy,
      },
    });

    this.logger.log(`Attribute value created: ${value.value}`);

    return {
      message: 'Attribute value created successfully',
      data: value,
    };
  }

  /**
   * Get Values by Attribute ID
   */
  async getValuesByAttribute(attributeId: string) {
    const values = await this.prisma.attributeValue.findMany({
      where: { attributeId, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      message: 'Attribute values retrieved successfully',
      data: values,
    };
  }

  /**
   * Get Attribute Value by ID
   */
  async getValueById(id: string) {
    const value = await this.prisma.attributeValue.findFirst({
      where: { id, isDeleted: false },
      include: {
        attribute: {
          include: {
            attributeSet: true,
          },
        },
      },
    });

    if (!value) {
      throw new NotFoundException('Attribute value not found');
    }

    return {
      message: 'Attribute value retrieved successfully',
      data: value,
    };
  }

  /**
   * Delete Attribute Value
   */
  async deleteValue(id: string) {
    const value = await this.prisma.attributeValue.findFirst({
      where: { id, isDeleted: false },
    });

    if (!value) {
      throw new NotFoundException('Attribute value not found');
    }

    const deleted = await this.prisma.attributeValue.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Attribute value deleted: ${deleted.value}`);

    return {
      message: 'Attribute value deleted successfully',
      data: deleted,
    };
  }
}
