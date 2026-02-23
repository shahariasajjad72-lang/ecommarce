import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Permission } from '@prisma/client';
import { memoryStorage } from 'multer';

import { UploadService } from './upload.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/interfaces';
import { ReorderImagesDto, DeleteImagesDto } from './dto';
import {
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
  VALID_FOLDERS,
} from './upload.constants';

// Multer config - memory storage for Sharp processing
const uploadConfig = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
};

@ApiTags('Upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // =========================================
  // UPLOAD SINGLE IMAGE
  // =========================================

  @ApiOperation({
    summary: 'Upload Single Image',
    description:
      'Upload a single image. Automatically converts to WebP and generates thumbnail.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPG, PNG, GIF, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    enum: VALID_FOLDERS,
    description: 'Folder to organize image',
    example: 'product',
  })
  @ApiQuery({
    name: 'alt',
    required: false,
    description: 'Alt text for SEO',
    example: 'Red Nike Shoes',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      example: {
        message: 'Image uploaded successfully',
        data: {
          id: 'clxxxx123',
          originalName: 'product.jpg',
          url: 'https://yourdomain.com/uploads/product/2026/02/abc123.webp',
          thumbnailUrl:
            'https://yourdomain.com/uploads/product/2026/02/abc123-thumb.webp',
          width: 1200,
          height: 800,
          size: 45000,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or no file provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Missing MANAGE_PRODUCTS permission',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post()
  @UseInterceptors(FileInterceptor('file', uploadConfig))
  async uploadSingle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder: string = 'general', // FIX: Use string instead of ImageFolder
    @Query('alt') alt?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const result = await this.uploadService.uploadImage(file, {
      folder,
      alt,
      createdBy: user?.id,
    });

    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  // =========================================
  // UPLOAD MULTIPLE IMAGES
  // =========================================

  @ApiOperation({
    summary: 'Upload Multiple Images',
    description: `Upload up to ${MAX_FILES_COUNT} images at once. Perfect for product galleries.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: `Image files (max ${MAX_FILES_COUNT})`,
        },
      },
      required: ['files'],
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    enum: VALID_FOLDERS,
    example: 'product',
  })
  @ApiQuery({ name: 'alt', required: false })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
  })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_COUNT, uploadConfig))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string = 'general', // FIX: Use string instead of ImageFolder
    @Query('alt') alt?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const results = await this.uploadService.uploadImages(files, {
      folder,
      alt,
      createdBy: user?.id,
    });

    return {
      message: `${results.length} images uploaded successfully`,
      data: results,
    };
  }

  // =========================================
  // GET ALL IMAGES
  // =========================================

  @ApiOperation({
    summary: 'Get All Images',
    description: 'Get all uploaded images. Filter by folder.',
  })
  @ApiQuery({ name: 'folder', required: false, enum: VALID_FOLDERS })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get()
  findAll(@Query('folder') folder?: string) {
    // FIX: Use string instead of ImageFolder
    return this.uploadService.findAll(folder);
  }

  // =========================================
  // GET IMAGE BY ID
  // =========================================

  @ApiOperation({ summary: 'Get Image by ID' })
  @ApiParam({ name: 'id', description: 'Image ID (CUID)' })
  @ApiResponse({ status: 200, description: 'Image retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  @Permissions(Permission.VIEW_PRODUCTS)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.uploadService.findById(id);
  }

  // =========================================
  // SOFT DELETE SINGLE
  // =========================================

  @ApiOperation({
    summary: 'Soft Delete Image',
    description: 'Mark image as deleted. File remains on server for recovery.',
  })
  @ApiParam({ name: 'id', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  softDelete(@Param('id') id: string) {
    // FIX: Removed unused user parameter
    return this.uploadService.softDelete(id);
  }

  // =========================================
  // SOFT DELETE MULTIPLE
  // =========================================

  @ApiOperation({
    summary: 'Soft Delete Multiple Images',
    description: 'Delete multiple images at once.',
  })
  @ApiBody({ type: DeleteImagesDto })
  @ApiResponse({ status: 200, description: 'Images deleted successfully' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  softDeleteMany(@Body() dto: DeleteImagesDto) {
    // FIX: Removed unused user parameter
    return this.uploadService.softDeleteMany(dto.imageIds);
  }

  // =========================================
  // RESTORE
  // =========================================

  @ApiOperation({ summary: 'Restore Deleted Image' })
  @ApiParam({ name: 'id', description: 'Image ID' })
  @ApiResponse({ status: 200, description: 'Image restored successfully' })
  @ApiResponse({ status: 404, description: 'Deleted image not found' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.uploadService.restore(id);
  }

  // =========================================
  // REORDER IMAGES
  // =========================================

  @ApiOperation({
    summary: 'Reorder Images',
    description: 'Update the display order of images (for galleries).',
  })
  @ApiBody({ type: ReorderImagesDto })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  @Permissions(Permission.MANAGE_PRODUCTS)
  @Patch('reorder')
  reorder(@Body() dto: ReorderImagesDto) {
    return this.uploadService.reorder(dto.imageIds);
  }
}
