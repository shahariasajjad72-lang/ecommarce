/**
 * CATEGORY SERVICE - ADJACENCY LIST PATTERN
 *
 * Hierarchical tree structure with level-based operations:
 * - Level 0: Root categories (Electronics, Clothing, etc.)
 * - Level 1: Main subcategories (Mobile, Laptop, PC / Men, Women, Children)
 * - Level 2+: Nested subcategories (iPhone, Samsung / T-shirt, Pants)
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFilterDto,
  AddCategoryToLevelDto,
} from './dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  private readonly MAX_DEPTH = 10; // Maximum nesting level

  constructor(private prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string, parentSlug?: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    // For nested categories, combine parent slug for uniqueness
    return parentSlug ? `${parentSlug}-${baseSlug}` : baseSlug;
  }

  /**
   * Generate materialized path for hierarchical queries
   */
  private async generatePath(
    parentId: string | null | undefined,
    slug: string,
  ): Promise<{ path: string; level: number }> {
    if (!parentId) {
      return {
        path: `/${slug}`,
        level: 0,
      };
    }

    const parent = await this.prisma.category.findUnique({
      where: { id: parentId, isDeleted: false },
      select: { path: true, level: true, slug: true },
    });

    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }

    if (parent.level >= this.MAX_DEPTH) {
      throw new BadRequestException(
        `Maximum nesting depth (${this.MAX_DEPTH}) reached`,
      );
    }

    return {
      path: `${parent.path}/${slug}`,
      level: parent.level + 1,
    };
  }

  /**
   * Update parent's isLeaf status
   */
  private async updateParentLeafStatus(parentId: string): Promise<void> {
    await this.prisma.category.update({
      where: { id: parentId },
      data: { isLeaf: false },
    });
  }

  /**
   * Check and update category's leaf status
   */
  private async updateCategoryLeafStatus(categoryId: string): Promise<void> {
    const childCount = await this.prisma.category.count({
      where: {
        parentId: categoryId,
        isDeleted: false,
      },
    });

    await this.prisma.category.update({
      where: { id: categoryId },
      data: { isLeaf: childCount === 0 },
    });
  }

  /**
   * Update all descendant paths when category is moved or renamed
   */
  private async updateDescendantPaths(
    categoryId: string,
    oldPath: string,
    newPath: string,
  ): Promise<void> {
    // Get all descendants
    const descendants = await this.prisma.category.findMany({
      where: {
        path: { startsWith: oldPath + '/' },
        isDeleted: false,
      },
      orderBy: { level: 'asc' },
    });

    // Update each descendant's path and level
    for (const descendant of descendants) {
      const updatedPath = descendant.path.replace(oldPath, newPath);
      const level = updatedPath.split('/').length - 1;

      await this.prisma.category.update({
        where: { id: descendant.id },
        data: {
          path: updatedPath,
          level,
        },
      });
    }

    if (descendants.length > 0) {
      this.logger.log(
        `Updated ${descendants.length} descendant paths from ${oldPath} to ${newPath}`,
      );
    }
  }

  // =========================================
  // 1. CREATE CATEGORY (General)
  // =========================================

  /**
   * CREATE CATEGORY
   * Creates a new category at any level
   */
  async create(dto: CreateCategoryDto, createdBy: string) {
    // Generate slug
    let parentSlug: string | undefined;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { slug: true },
      });
      parentSlug = parent?.slug;
    }

    const slug = dto.slug || this.generateSlug(dto.name, parentSlug);

    // Check for duplicate slug
    const existingSlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Category with slug "${slug}" already exists`,
      );
    }

    // Generate path and level
    const { path, level } = await this.generatePath(dto.parentId, slug);

    // Create category
    const category = await this.prisma.$transaction(async (tx) => {
      const created = await tx.category.create({
        data: {
          name: dto.name,
          slug,
          parentId: dto.parentId || null,
          path,
          level,
          description: dto.description,
          image: dto.image,
          icon: dto.icon,
          sortOrder: dto.sortOrder ?? 0,
          isLeaf: true,
          createdBy,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              level: true,
            },
          },
        },
      });

      // Update parent's leaf status
      if (dto.parentId) {
        await this.updateParentLeafStatus(dto.parentId);
      }

      return created;
    });

    this.logger.log(
      `Category created: ${category.name} (Level ${category.level}, Path: ${category.path})`,
    );

    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  // =========================================
  // 2. GET CATEGORIES BY LEVEL
  // =========================================

  /**
   * GET CATEGORIES BY LEVEL
   * Returns all categories at a specific level
   * Level 0 = Root (Electronics, Clothing)
   * Level 1 = Main subcategories (Mobile, Laptop, Men, Women)
   * Level 2+ = Nested subcategories (iPhone, Samsung, T-shirt)
   */
  async getCategoriesByLevel(level: number, parentId?: string) {
    if (level < 0 || level > this.MAX_DEPTH) {
      throw new BadRequestException(
        `Level must be between 0 and ${this.MAX_DEPTH}`,
      );
    }

    const where: any = {
      level,
      isDeleted: false,
      isActive: true,
    };

    // If parentId is provided, filter by parent
    if (parentId !== undefined) {
      if (parentId === 'null' || parentId === null) {
        where.parentId = null;
      } else {
        where.parentId = parentId;
      }
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
        _count: {
          select: {
            children: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    return {
      message: `Categories at level ${level} retrieved successfully`,
      data: categories.map((cat) => ({
        ...cat,
        childrenCount: cat._count.children,
        _count: undefined,
      })),
      meta: {
        level,
        total: categories.length,
      },
    };
  }

  // =========================================
  // 3. ADD CATEGORY TO SPECIFIC LEVEL
  // =========================================

  /**
   * ADD CATEGORY TO LEVEL
   * Smart creation based on level selection:
   * - Level 0: Creates root category (no parent needed)
   * - Level 1+: Requires parent selection from previous level
   */
  async addCategoryToLevel(dto: AddCategoryToLevelDto, createdBy: string) {
    const { level, name, parentId, description, image, icon, sortOrder } = dto;

    // Validate level
    if (level < 0 || level > this.MAX_DEPTH) {
      throw new BadRequestException(
        `Level must be between 0 and ${this.MAX_DEPTH}`,
      );
    }

    // Level 0 (Root) should not have parent
    if (level === 0 && parentId) {
      throw new BadRequestException(
        'Level 0 categories cannot have a parent',
      );
    }

    // Level 1+ must have parent
    if (level > 0 && !parentId) {
      throw new BadRequestException(
        `Level ${level} categories must have a parent from level ${level - 1}`,
      );
    }

    // Verify parent is at correct level
    if (parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: parentId,
          isDeleted: false,
        },
        select: { level: true, slug: true, name: true },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      if (parent.level !== level - 1) {
        throw new BadRequestException(
          `Parent must be at level ${level - 1}. Selected parent "${parent.name}" is at level ${parent.level}`,
        );
      }
    }

    // Create the category
    const createDto: CreateCategoryDto = {
      name,
      parentId,
      description,
      image,
      icon,
      sortOrder,
    };

    return this.create(createDto, createdBy);
  }

  // =========================================
  // 4. GET CATEGORY TREE (HIERARCHICAL)
  // =========================================

  /**
   * GET FULL CATEGORY TREE
   * Returns hierarchical structure with all levels
   * Electronics
   *  ├── Mobile
   *  │   ├── iPhone
   *  │   └── Samsung
   *  └── Laptop
   */
  async getTree() {
    const allCategories = await this.prisma.category.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    type CategoryWithChildren = typeof allCategories[0] & { children: CategoryWithChildren[] };
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // Create map with children arrays
    for (const category of allCategories) {
      categoryMap.set(category.id, { ...category, children: [] });
    }

    // Build hierarchy
    for (const category of allCategories) {
      const node = categoryMap.get(category.id);

      if (category.parentId === null) {
        rootCategories.push(node!);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node!);
        }
      }
    }

    return {
      message: 'Category tree retrieved successfully',
      data: rootCategories,
      meta: {
        totalCategories: allCategories.length,
        rootCount: rootCategories.length,
      },
    };
  }

  // =========================================
  // 5. GET CATEGORY BY ID
  // =========================================

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
        children: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            isLeaf: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  // =========================================
  // 6. GET CATEGORY BY SLUG
  // =========================================

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isDeleted: false },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  // =========================================
  // 7. GET ALL CATEGORIES (FLAT LIST)
  // =========================================

  async findAll(filters: CategoryFilterDto) {
    const {
      parentId,
      level,
      isActive,
      includeDeleted = false,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (!includeDeleted) {
      where.isDeleted = false;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    if (level !== undefined) {
      where.level = level;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
              level: true,
            },
          },
          _count: {
            select: {
              children: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      message: 'Categories retrieved successfully',
      data: categories.map((cat) => ({
        ...cat,
        childrenCount: cat._count.children,
        _count: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================
  // 8. GET CATEGORY CHILDREN
  // =========================================

  async getChildren(categoryId: string) {
    const parent = await this.prisma.category.findFirst({
      where: { id: categoryId, isDeleted: false },
    });

    if (!parent) {
      throw new NotFoundException('Category not found');
    }

    const children = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            children: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Children retrieved successfully',
      data: children.map((cat) => ({
        ...cat,
        childrenCount: cat._count.children,
        _count: undefined,
      })),
      meta: {
        parentId: categoryId,
        parentName: parent.name,
        parentLevel: parent.level,
        total: children.length,
      },
    };
  }

  // =========================================
  // 9. GET BREADCRUMB
  // =========================================

  async getBreadcrumb(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, isDeleted: false },
      select: { path: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const slugs = category.path.split('/').filter(Boolean);

    type BreadcrumbItem = {
      id: string;
      name: string;
      slug: string;
      level: number;
    };
    const breadcrumb: BreadcrumbItem[] = [];
    let currentPath = '';

    for (const slug of slugs) {
      currentPath += `/${slug}`;

      const cat = await this.prisma.category.findFirst({
        where: { path: currentPath, isDeleted: false },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
        },
      });

      if (cat) {
        breadcrumb.push(cat);
      }
    }

    return {
      message: 'Breadcrumb retrieved successfully',
      data: breadcrumb,
    };
  }

  // =========================================
  // 10. UPDATE CATEGORY
  // =========================================

  async update(id: string, dto: UpdateCategoryDto, updatedBy: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check slug uniqueness
    if (dto.slug && dto.slug !== category.slug) {
      const existingSlug = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });

      if (existingSlug) {
        throw new ConflictException(
          `Category with slug "${dto.slug}" already exists`,
        );
      }
    }

    // Prevent moving category to its own descendant
    if (dto.parentId && dto.parentId !== category.parentId) {
      const newParent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { path: true, level: true },
      });

      if (!newParent) {
        throw new BadRequestException('New parent category not found');
      }

      if (newParent.path.startsWith(category.path + '/')) {
        throw new BadRequestException(
          'Cannot move category to its own descendant',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      let updateData: any = {
        ...dto,
        updatedBy,
      };

      const needsPathUpdate =
        dto.name !== undefined ||
        dto.slug !== undefined ||
        (dto.parentId !== undefined && dto.parentId !== category.parentId);

      if (needsPathUpdate) {
        const newSlug =
          dto.slug ||
          (dto.name ? this.generateSlug(dto.name) : category.slug);
        const { path, level } = await this.generatePath(
          dto.parentId !== undefined ? dto.parentId : category.parentId,
          newSlug,
        );

        updateData = {
          ...updateData,
          slug: newSlug,
          path,
          level,
        };

        await this.updateDescendantPaths(id, category.path, path);
      }

      const result = await tx.category.update({
        where: { id },
        data: updateData,
      });

      // Update parent leaf statuses
      if (dto.parentId !== undefined && dto.parentId !== category.parentId) {
        if (category.parentId) {
          await this.updateCategoryLeafStatus(category.parentId);
        }

        if (dto.parentId) {
          await this.updateParentLeafStatus(dto.parentId);
        }
      }

      return result;
    });

    this.logger.log(`Category updated: ${updated.name} (${updated.path})`);

    return {
      message: 'Category updated successfully',
      data: updated,
    };
  }

  // =========================================
  // 11. DELETE CATEGORY (SOFT DELETE)
  // =========================================

  async delete(id: string, deletedBy: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const childrenCount = await this.prisma.category.count({
      where: {
        parentId: id,
        isDeleted: false,
      },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with active children. Delete children first.',
      );
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const result = await tx.category.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
          updatedBy: deletedBy,
        },
      });

      if (category.parentId) {
        await this.updateCategoryLeafStatus(category.parentId);
      }

      return result;
    });

    this.logger.log(`Category deleted: ${deleted.name}`);

    return {
      message: 'Category deleted successfully',
      data: deleted,
    };
  }

  // =========================================
  // 12. RESTORE DELETED CATEGORY
  // =========================================

  async restore(id: string, restoredBy: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isDeleted: true },
    });

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    if (category.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: category.parentId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!parent) {
        throw new BadRequestException(
          'Cannot restore: parent category is deleted or inactive',
        );
      }
    }

    const restored = await this.prisma.$transaction(async (tx) => {
      const result = await tx.category.update({
        where: { id },
        data: {
          isDeleted: false,
          isActive: true,
          deletedAt: null,
          updatedBy: restoredBy,
        },
      });

      if (category.parentId) {
        await this.updateParentLeafStatus(category.parentId);
      }

      return result;
    });

    this.logger.log(`Category restored: ${restored.name}`);

    return {
      message: 'Category restored successfully',
      data: restored,
    };
  }

  // =========================================
  // 13. GET LEVEL STATISTICS
  // =========================================

  /**
   * GET LEVEL STATISTICS
   * Returns count of categories at each level
   */
  async getLevelStatistics() {
    const stats = await this.prisma.category.groupBy({
      by: ['level'],
      where: {
        isDeleted: false,
      },
      _count: {
        id: true,
      },
      orderBy: {
        level: 'asc',
      },
    });

    return {
      message: 'Level statistics retrieved successfully',
      data: stats.map((stat) => ({
        level: stat.level,
        count: stat._count.id,
      })),
    };
  }
}
