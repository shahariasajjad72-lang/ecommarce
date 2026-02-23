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
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/interfaces';

@ApiTags('tags')
@ApiBearerAuth('access-token')
@Controller('tags')
export class TagController {
  constructor(private readonly TagService: TagService) {}

  @ApiOperation({
    summary: 'Create tag',
    description:
      'Create a new tag with name, logo, and SEO metadata. Requires MANAGE_PRODUCTS permission.||',
  })
  @ApiResponse({
    status: 201,
    description: 'tag created successfully',
    schema: {
      example: {
        success: true,
        message: 'tag created successfully',
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
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @ApiResponse({ status: 409, description: 'tag name or slug already exists' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post()
  create(@Body() dto: CreateTagDto, @CurrentUser() user: AuthenticatedUser) {
    return this.TagService.create(dto, user.id);
  }

  @ApiOperation({
    summary: 'Get All tags',
    description:
      'Get list of all active tags. Requires VIEW_PRODUCTS permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'tags retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'tags retrieved successfully',
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
    return this.TagService.findAll();
  }

  @ApiOperation({
    summary: 'Get tag by ID',
    description: 'Get single tag by ID. Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'tag ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'tag retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'tag not found' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.TagService.findById(id);
  }

  @ApiOperation({
    summary: 'Get tag by Slug',
    description:
      'Get single tag by slug (SEO-friendly URL). Requires VIEW_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'slug',
    description: 'tag slug',
    example: 'apple',
  })
  @ApiResponse({
    status: 200,
    description: 'tag retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'tag not found' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.TagService.findBySlug(slug);
  }

  @ApiOperation({
    summary: 'Update tag',
    description:
      'Update tag details including name, logo, and SEO metadata. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'tag ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'tag updated successfully',
  })
  @ApiResponse({ status: 404, description: 'tag not found' })
  @ApiResponse({ status: 409, description: 'tag name or slug already exists' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.TagService.update(id, dto, user.id);
  }

  @ApiOperation({
    summary: 'Delete tag',
    description:
      'Soft delete tag. Can be restored later. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'tag ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'tag deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'tag not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.TagService.delete(id, user.id);
  }

  @ApiOperation({
    summary: 'Restore Deleted tag',
    description:
      'Restore a soft-deleted tag. Requires MANAGE_PRODUCTS permission.',
  })
  @ApiParam({
    name: 'id',
    description: 'tag ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'tag restored successfully',
  })
  @ApiResponse({ status: 404, description: 'Deleted tag not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.TagService.restore(id, user.id);
  }
}
