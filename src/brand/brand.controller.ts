/**
 * BRAND CONTROLLER
 *
 * 7 Essential Endpoints:
 * - Create Brand
 * - Get All Brands
 * - Get Brand by ID
 * - Get Brand by Slug
 * - Update Brand
 * - Delete Brand (soft delete)
 * - Restore Brand
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { BrandService } from './brand.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/interfaces';

@ApiTags('Brands')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @ApiOperation({
    summary: 'Create Brand',
    description: 'Create a new brand with name, logo, and SEO metadata. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
    schema: {
      example: {
        success: true,
        message: 'Brand created successfully',
        data: {
          id: 'clxxxx1234567890',
          name: 'Apple',
          slug: 'apple',
          logo: 'https://example.com/logos/apple.png',
          description: 'American multinational technology company',
          metaTitle: 'Apple Products - Buy iPhone, iPad, MacBook',
          metaDescription: 'Shop the latest Apple products...',
          isActive: true,
          createdAt: '2024-01-28T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Missing MANAGE_PRODUCTS permission' })
  @ApiResponse({ status: 409, description: 'Brand name or slug already exists' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post()
  create(@Body() dto: CreateBrandDto, @CurrentUser() user: AuthenticatedUser) {
    return this.brandService.create(dto, user.id);
  }

  @ApiOperation({
    summary: 'Get All Brands',
    description: 'Get list of all active brands. Requires VIEW_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Brands retrieved successfully',
        data: [
          {
            id: 'clxxxx1234567890',
            name: 'Apple',
            slug: 'apple',
            logo: 'https://example.com/logos/apple.png',
            metaTitle: 'Apple Products',
            metaDescription: 'Shop Apple products...',
            isActive: true,
          },
          {
            id: 'clyyyy9876543210',
            name: 'Samsung',
            slug: 'samsung',
            logo: 'https://example.com/logos/samsung.png',
            metaTitle: 'Samsung Products',
            metaDescription: 'Shop Samsung products...',
            isActive: true,
          },
        ],
      },
    },
  })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @ApiOperation({
    summary: 'Get Brand by ID',
    description: 'Get single brand by ID. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.brandService.findById(id);
  }

  @ApiOperation({
    summary: 'Get Brand by Slug',
    description: 'Get single brand by slug (SEO-friendly URL). Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Brand slug',
    example: 'apple',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.brandService.findBySlug(slug);
  }

  @ApiOperation({
    summary: 'Update Brand',
    description: 'Update brand details including name, logo, and SEO metadata. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({ status: 409, description: 'Brand name or slug already exists' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.brandService.update(id, dto, user.id);
  }

  @ApiOperation({
    summary: 'Delete Brand',
    description: 'Soft delete brand. Can be restored later. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.brandService.delete(id, user.id);
  }

  @ApiOperation({
    summary: 'Restore Deleted Brand',
    description: 'Restore a soft-deleted brand. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand restored successfully',
  })
  @ApiResponse({ status: 404, description: 'Deleted brand not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.brandService.restore(id, user.id);
  }
}
