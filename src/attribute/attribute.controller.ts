/**
 * ATTRIBUTE CONTROLLER - SIMPLIFIED
 *
 * 12 Essential Endpoints:
 * - AttributeSet: Create, GetAll, GetById, GetBySlug, Delete
 * - Attribute: Create, GetBySet, GetById, GetBySlug, Delete
 * - AttributeValue: Create, GetByAttribute, Delete
 */

import {
  Controller,
  Get,
  Post,
  Body,
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
import { AttributeService } from './attribute.service';
import {
  CreateAttributeSetDto,
  CreateAttributeDto,
  CreateAttributeValueDto,
} from './dto/attribute.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/interfaces';

@ApiTags('Attributes')
@ApiBearerAuth('access-token')
@Controller('attributes')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  // ========================================
  // ATTRIBUTE SET ENDPOINTS (5)
  // ========================================

  @ApiOperation({ summary: 'Create Attribute Set' })
  @ApiResponse({ status: 201, description: 'Attribute set created' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post('sets')
  createSet(
    @Body() dto: CreateAttributeSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attributeService.createSet(dto, user.id);
  }

  @ApiOperation({
    summary: 'Get All Attribute Sets (with nested attributes & values)',
  })
  @ApiResponse({ status: 200, description: 'Attribute sets retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('sets')
  getAllSets() {
    return this.attributeService.getAllSets();
  }

  @ApiOperation({ summary: 'Get Attribute Set by ID' })
  @ApiParam({ name: 'id', description: 'Attribute set ID' })
  @ApiResponse({ status: 200, description: 'Attribute set retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('sets/:id')
  getSetById(@Param('id') id: string) {
    return this.attributeService.getSetById(id);
  }

  @ApiOperation({ summary: 'Get Attribute Set by Slug' })
  @ApiParam({
    name: 'slug',
    description: 'Attribute set slug',
    example: 'specifications',
  })
  @ApiResponse({ status: 200, description: 'Attribute set retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('sets/slug/:slug')
  getSetBySlug(@Param('slug') slug: string) {
    return this.attributeService.getSetBySlug(slug);
  }

  @ApiOperation({ summary: 'Delete Attribute Set' })
  @ApiParam({ name: 'id', description: 'Attribute set ID' })
  @ApiResponse({ status: 200, description: 'Attribute set deleted' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete('sets/:id')
  @HttpCode(HttpStatus.OK)
  deleteSet(@Param('id') id: string) {
    return this.attributeService.deleteSet(id);
  }

  // ========================================
  // ATTRIBUTE ENDPOINTS (5)
  // ========================================

  @ApiOperation({ summary: 'Create Attribute' })
  @ApiResponse({ status: 201, description: 'Attribute created' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post()
  createAttribute(
    @Body() dto: CreateAttributeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attributeService.createAttribute(dto, user.id);
  }

  @ApiOperation({ summary: 'Get Attributes by Set ID (with values)' })
  @ApiParam({ name: 'setId', description: 'Attribute set ID' })
  @ApiResponse({ status: 200, description: 'Attributes retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('by-set/:setId')
  getAttributesBySet(@Param('setId') setId: string) {
    return this.attributeService.getAttributesBySet(setId);
  }

  @ApiOperation({ summary: 'Get Attribute by ID (with values)' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id')
  getAttributeById(@Param('id') id: string) {
    return this.attributeService.getAttributeById(id);
  }

  @ApiOperation({ summary: 'Get Attribute by Slug' })
  @ApiParam({ name: 'setId', description: 'Attribute set ID' })
  @ApiParam({ name: 'slug', description: 'Attribute slug', example: 'ram' })
  @ApiResponse({ status: 200, description: 'Attribute retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('by-slug/:setId/:slug')
  getAttributeBySlug(
    @Param('setId') setId: string,
    @Param('slug') slug: string,
  ) {
    return this.attributeService.getAttributeBySlug(setId, slug);
  }

  @ApiOperation({ summary: 'Delete Attribute' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute deleted' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteAttribute(@Param('id') id: string) {
    return this.attributeService.deleteAttribute(id);
  }

  // ========================================
  // ATTRIBUTE VALUE ENDPOINTS (3)
  // ========================================

  @ApiOperation({ summary: 'Create Attribute Value' })
  @ApiResponse({ status: 201, description: 'Attribute value created' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post('values')
  createValue(
    @Body() dto: CreateAttributeValueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attributeService.createValue(dto, user.id);
  }

  @ApiOperation({ summary: 'Get Values by Attribute ID' })
  @ApiParam({ name: 'attributeId', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute values retrieved' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get('values/by-attribute/:attributeId')
  getValuesByAttribute(@Param('attributeId') attributeId: string) {
    return this.attributeService.getValuesByAttribute(attributeId);
  }

  @ApiOperation({ summary: 'Delete Attribute Value' })
  @ApiParam({ name: 'id', description: 'Attribute value ID' })
  @ApiResponse({ status: 200, description: 'Attribute value deleted' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete('values/:id')
  @HttpCode(HttpStatus.OK)
  deleteValue(@Param('id') id: string) {
    return this.attributeService.deleteValue(id);
  }
}
