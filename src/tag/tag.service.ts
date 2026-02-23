import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CreateBrandDto } from 'src/brand/dto/brand.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  private readonly Logger = new Logger(TagService.name);

  constructor(private Prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Create Tags
  async create(dto: CreateBrandDto, createdBy: string) {
    const slug = dto.slug || this.generateSlug(dto.name);

    // check slug uniqueness
    const existingSlug = await this.Prisma.tag.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Tag with slug "${slug}" already exists`);
    }

    const existingName = await this.Prisma.tag.findUnique({
      where: { name: dto.name },
    });

    if (existingName) {
      throw new ConflictException(
        ' Tag with name "${dto.name}" already exists',
      );
    }

    const tag = await this.Prisma.tag.create({
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

    this.Logger.log(`Tag created: ${tag.name}`);

    return {
      message: 'Tag create successfully',
      data: tag,
    };
  }

  // GET ALL TAGS

  async findAll() {
    const tags = await this.Prisma.tag.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    });

    return {
      message: 'Brands retrieved successfully',
      data: tags,
    };
  }

  // Get tags by id

  async findById(id: string) {
    const tag = await this.Prisma.tag.findFirst({
      where: { id, isDeleted: false },
    });

    if (!tag) {
      throw new NotFoundException(' Tag not found');
    }

    return {
      message: 'tag retrieved successfully',
      data: tag,
    };
  }

  // Get by slug
  async findBySlug(slug: string) {
    const tag = await this.Prisma.tag.findFirst({
      where: { slug, isDeleted: false },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return {
      message: 'tag retrieved successfully',
      data: tag,
    };
  }

  // Update tags
  async update(id: string, dto: UpdateTagDto, updatedBy: string) {
    const tag = await this.Prisma.tag.findFirst({
      where: { id, isDeleted: false },
    });

    if (!tag) {
      throw new NotFoundException('tag is not found');
    }

    // check slug uniqueness if needed
    if (dto.slug && dto.slug == tag.slug) {
      const existingSlug = await this.Prisma.tag.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });

      if (existingSlug) {
        throw new ConflictException(
          ` tag with slug "${dto.slug}" already exists `,
        );
      }
    }

    // Check name uniqueness if changed
    if (dto.name && dto.name !== tag.name) {
      const existingName = await this.Prisma.tag.findFirst({
        where: { name: dto.name, id: { not: id } },
      });

      if (existingName) {
        throw new ConflictException(
          `Brand with name "${dto.name}" already exists`,
        );
      }
    }

    const updated = await this.Prisma.tag.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug || (dto.name ? this.generateSlug(dto.name) : undefined),
        updatedBy,
      },
    });

    this.Logger.log(`Brand updated: ${updated.name}`);

    return {
      message: 'Brand updated successfully',
      data: updated,
    };
  }

  /**
   * DELETE BRAND (SOFT DELETE)
   */
  async delete(id: string, deletedBy: string) {
    const brand = await this.Prisma.brand.findFirst({
      where: { id, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const deleted = await this.Prisma.brand.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });

    this.Logger.log(`Brand deleted: ${deleted.name}`);

    return {
      message: 'Brand deleted successfully',
      data: deleted,
    };
  }

  /**
   * RESTORE DELETED BRAND
   */
  async restore(id: string, restoredBy: string) {
    const brand = await this.Prisma.brand.findFirst({
      where: { id, isDeleted: true },
    });

    if (!brand) {
      throw new NotFoundException('Deleted brand not found');
    }

    const restored = await this.Prisma.brand.update({
      where: { id },
      data: {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
        updatedBy: restoredBy,
      },
    });

    this.Logger.log(`Brand restored: ${restored.name}`);

    return {
      message: 'Brand restored successfully',
      data: restored,
    };
  }
}
