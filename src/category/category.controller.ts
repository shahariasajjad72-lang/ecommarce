import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFilterDto,
  CategoryTreeDto,
  CategoryResponseDto,
  BreadcrumbItemDto,
  AddCategoryToLevelDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/interfaces';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // =========================================
  // LEVEL-BASED APIs (NEW)
  // =========================================

  /**
   * API 1: GET CATEGORIES BY LEVEL
   * Get all categories at a specific level
   * Level 0 = Root (Electronics, Clothing)
   * Level 1 = Main subcategories (Mobile, Laptop, Men, Women)
   * Level 2+ = Nested (iPhone, Samsung, T-shirt)
   */
  @ApiOperation({
    summary: 'Get Categories by Level',
    description:
      'Get all categories at a specific hierarchical level. Level 0 = root categories (Electronics, Clothing), Level 1 = main subcategories (Mobile, Laptop), Level 2+ = nested subcategories (iPhone, Samsung). Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'level',
    description: 'Category level (0 = root, 1 = first level, etc.)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'parentId',
    description:
      'Optional: Filter by parent category ID to get children at specified level',
    required: false,
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        message: 'Categories at level 1 retrieved successfully',
        data: [
          {
            id: 'clxxxx001',
            name: 'Mobile',
            slug: 'electronics-mobile',
            level: 1,
            parentId: 'clxxxx000',
            parent: {
              id: 'clxxxx000',
              name: 'Electronics',
              slug: 'electronics',
              level: 0,
            },
            childrenCount: 2,
            isLeaf: false,
          },
          {
            id: 'clxxxx002',
            name: 'Laptop',
            slug: 'electronics-laptop',
            level: 1,
            parentId: 'clxxxx000',
            parent: {
              id: 'clxxxx000',
              name: 'Electronics',
              slug: 'electronics',
              level: 0,
            },
            childrenCount: 3,
            isLeaf: false,
          },
        ],
        meta: {
          level: 1,
          total: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid level (must be 0-10)',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('level/:level')
  getCategoriesByLevel(
    @Param('level', ParseIntPipe) level: number,
    @Query('parentId') parentId?: string,
  ) {
    return this.categoryService.getCategoriesByLevel(level, parentId);
  }

  /**
   * API 2: ADD CATEGORY TO LEVEL
   * Smart creation based on level selection
   */
  @ApiOperation({
    summary: 'Add Category to Specific Level',
    description:
      'Create a new category at a specific level. For Level 0, no parent is needed. For Level 1+, parent from previous level is required. Example: To add "Laptop" at Level 1 under "Electronics" (Level 0), provide Electronics ID as parent. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category added successfully',
    schema: {
      example: {
        message: 'Category created successfully',
        data: {
          id: 'clxxxx003',
          name: 'PC',
          slug: 'electronics-pc',
          level: 1,
          parentId: 'clxxxx000',
          parent: {
            id: 'clxxxx000',
            name: 'Electronics',
            slug: 'electronics',
            level: 0,
          },
          path: '/electronics/electronics-pc',
          isLeaf: true,
          sortOrder: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid data: level mismatch, missing parent, or parent at wrong level',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post('add-to-level')
  addCategoryToLevel(
    @Body() dto: AddCategoryToLevelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoryService.addCategoryToLevel(dto, user.id);
  }

  /**
   * API 3: GET LEVEL STATISTICS
   * Show count of categories at each level
   */
  @ApiOperation({
    summary: 'Get Level Statistics',
    description:
      'Get count of categories at each level. Useful for understanding category hierarchy depth. Requires VIEW_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        message: 'Level statistics retrieved successfully',
        data: [
          { level: 0, count: 3 },
          { level: 1, count: 8 },
          { level: 2, count: 15 },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('level-stats')
  getLevelStatistics() {
    return this.categoryService.getLevelStatistics();
  }

  // =========================================
  // STANDARD CRUD APIs
  // =========================================

  @ApiOperation({
    summary: 'Create New Category',
    description:
      'Create a new category. Can be root (no parent) or child of existing category. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or parent not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoryService.create(createCategoryDto, user.id);
  }

  @ApiOperation({
    summary: 'Get All Categories (Flat List)',
    description:
      'Get paginated list of categories with filters. Returns flat structure. Requires VIEW_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get()
  findAll(@Query() filters: CategoryFilterDto) {
    return this.categoryService.findAll(filters);
  }

  @ApiOperation({
    summary: 'Get Full Category Tree',
    description:
      'Get complete category hierarchy with nested children. Optimized for navigation menus. Requires VIEW_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
    type: [CategoryTreeDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('tree')
  getTree() {
    return this.categoryService.getTree();
  }

  @ApiOperation({
    summary: 'Get Category by ID',
    description:
      'Get single category details with parent and children info. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @ApiOperation({
    summary: 'Get Category by Slug',
    description:
      'Get category by URL-friendly slug. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Category slug',
    example: 'electronics-mobile',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @ApiOperation({
    summary: 'Get Category Children',
    description:
      'Get direct children of a category. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Parent category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Children retrieved successfully',
    type: [CategoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id/children')
  getChildren(@Param('id') id: string) {
    return this.categoryService.getChildren(id);
  }

  @ApiOperation({
    summary: 'Get Category Breadcrumb',
    description:
      'Get breadcrumb trail from root to category. Useful for navigation. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Breadcrumb retrieved successfully',
    type: [BreadcrumbItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing VIEW_PRODUCTS permission',
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id/breadcrumb')
  getBreadcrumb(@Param('id') id: string) {
    return this.categoryService.getBreadcrumb(id);
  }

  @ApiOperation({
    summary: 'Update Category',
    description:
      'Update category details. Can move category to different parent. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or circular reference',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoryService.update(id, updateCategoryDto, user.id);
  }

  @ApiOperation({
    summary: 'Delete Category',
    description:
      'Soft delete category. Cannot delete if has active children. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Category has active children',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categoryService.delete(id, user.id);
  }

  @ApiOperation({
    summary: 'Restore Deleted Category',
    description:
      'Restore a soft-deleted category. Parent must be active. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Category restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Deleted category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Parent category is deleted or inactive',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categoryService.restore(id, user.id);
  }
}
