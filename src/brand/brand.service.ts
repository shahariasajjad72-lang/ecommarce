/**
 * BRAND SERVICE
 * Handles all brand operations
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * CREATE BRAND
   */
  async create(dto: CreateBrandDto, createdBy: string) {
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check slug uniqueness
    const existingSlug = await this.prisma.brand.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Brand with slug "${slug}" already exists`);
    }

    // Check name uniqueness
    const existingName = await this.prisma.brand.findUnique({
      where: { name: dto.name },
    });

    if (existingName) {
      throw new ConflictException(
        `Brand with name "${dto.name}" already exists`,
      );
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logo: dto.logo,
        description: dto.description,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        createdBy,
      },
    });

    this.logger.log(`Brand created: ${brand.name}`);

    return {
      message: 'Brand created successfully',
      data: brand,
    };
  }

  /**
   * GET ALL BRANDS
   */
  async findAll() {
    const brands = await this.prisma.brand.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    });

    return {
      message: 'Brands retrieved successfully',
      data: brands,
    };
  }

  /**
   * GET BRAND BY ID
   */
  async findById(id: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand retrieved successfully',
      data: brand,
    };
  }

  /**
   * GET BRAND BY SLUG
   */
  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { slug, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand retrieved successfully',
      data: brand,
    };
  }

  /**
   * UPDATE BRAND
   */
  async update(id: string, dto: UpdateBrandDto, updatedBy: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Check slug uniqueness if changed
    if (dto.slug && dto.slug !== brand.slug) {
      const existingSlug = await this.prisma.brand.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });

      if (existingSlug) {
        throw new ConflictException(
          `Brand with slug "${dto.slug}" already exists`,
        );
      }
    }

    // Check name uniqueness if changed
    if (dto.name && dto.name !== brand.name) {
      const existingName = await this.prisma.brand.findFirst({
        where: { name: dto.name, id: { not: id } },
      });

      if (existingName) {
        throw new ConflictException(
          `Brand with name "${dto.name}" already exists`,
        );
      }
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug || (dto.name ? this.generateSlug(dto.name) : undefined),
        updatedBy,
      },
    });

    this.logger.log(`Brand updated: ${updated.name}`);

    return {
      message: 'Brand updated successfully',
      data: updated,
    };
  }

  /**
   * DELETE BRAND (SOFT DELETE)
   */
  async delete(id: string, deletedBy: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const deleted = await this.prisma.brand.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });

    this.logger.log(`Brand deleted: ${deleted.name}`);

    return {
      message: 'Brand deleted successfully',
      data: deleted,
    };
  }

  /**
   * RESTORE DELETED BRAND
   */
  async restore(id: string, restoredBy: string) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, isDeleted: true },
    });

    if (!brand) {
      throw new NotFoundException('Deleted brand not found');
    }

    const restored = await this.prisma.brand.update({
      where: { id },
      data: {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        updatedBy: restoredBy,
      },
    });

    this.logger.log(`Brand restored: ${restored.name}`);

    return {
      message: 'Brand restored successfully',
      data: restored,
    };
  }
}
