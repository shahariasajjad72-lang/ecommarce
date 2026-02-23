import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import sharp from 'sharp'; // FIX: Changed from * as sharp
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_QUALITY,
  MAX_IMAGE_WIDTH,
  THUMBNAIL_SIZE,
} from './upload.constants';
import { ImageResponseDto } from './dto';

// ============================================
// INTERFACES
// ============================================

interface ProcessedImage {
  filename: string;
  path: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
}

interface UploadOptions {
  folder: string;
  alt?: string;
  createdBy?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly baseUrl: string;
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl =
      this.config.get<string>('BASE_URL') || 'http://localhost:3001';
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || 'uploads';
  }

  // ============================================
  // UPLOAD SINGLE IMAGE
  // ============================================

  async uploadImage(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<ImageResponseDto> {
    // Validate file
    this.validateImage(file);

    // Process and save image
    const processed = await this.processAndSaveImage(file, options.folder);

    // Save to database
    const image = await this.prisma.image.create({
      data: {
        originalName: file.originalname,
        filename: processed.filename,
        path: processed.path,
        url: processed.url,
        mimetype: 'image/webp',
        size: processed.size,
        width: processed.width,
        height: processed.height,
        thumbnailUrl: processed.thumbnailUrl,
        folder: options.folder,
        alt: options.alt,
        createdBy: options.createdBy,
      },
    });

    this.logger.log(`Image uploaded: ${file.originalname} -> ${image.url}`);

    return this.formatResponse(image);
  }

  // ============================================
  // UPLOAD MULTIPLE IMAGES
  // ============================================

  async uploadImages(
    files: Express.Multer.File[],
    options: UploadOptions,
  ): Promise<ImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results: ImageResponseDto[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadImage(files[i], options);

      // Set sort order
      await this.prisma.image.update({
        where: { id: result.id },
        data: { sortOrder: i },
      });

      results.push(result);
    }

    this.logger.log(`${results.length} images uploaded to ${options.folder}`);

    return results;
  }

  // ============================================
  // GET IMAGES
  // ============================================

  async findAll(folder?: string) {
    const where: Record<string, unknown> = { isDeleted: false };
    if (folder) where.folder = folder;

    const images = await this.prisma.image.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      message: 'Images retrieved successfully',
      data: images.map((img) => this.formatResponse(img)), // FIX: Arrow function
    };
  }

  async findById(id: string) {
    const image = await this.prisma.image.findFirst({
      where: { id, isDeleted: false },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return {
      message: 'Image retrieved successfully',
      data: this.formatResponse(image),
    };
  }

  // ============================================
  // SOFT DELETE
  // ============================================

  async softDelete(id: string) {
    // FIX: Removed unused deletedBy parameter
    const image = await this.prisma.image.findFirst({
      where: { id, isDeleted: false },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.image.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Image soft deleted: ${image.originalName}`);

    return { message: 'Image deleted successfully' };
  }

  async softDeleteMany(ids: string[]) {
    // FIX: Removed unused deletedBy parameter
    const result = await this.prisma.image.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`${result.count} images soft deleted`);

    return { message: `${result.count} images deleted successfully` };
  }

  // ============================================
  // RESTORE
  // ============================================

  async restore(id: string) {
    const image = await this.prisma.image.findFirst({
      where: { id, isDeleted: true },
    });

    if (!image) {
      throw new NotFoundException('Deleted image not found');
    }

    await this.prisma.image.update({
      where: { id },
      data: {
        isDeleted: false,
        isActive: true,
        deletedAt: null,
      },
    });

    this.logger.log(`Image restored: ${image.originalName}`);

    return { message: 'Image restored successfully' };
  }

  // ============================================
  // REORDER IMAGES
  // ============================================

  async reorder(imageIds: string[]) {
    for (let i = 0; i < imageIds.length; i++) {
      await this.prisma.image.update({
        where: { id: imageIds[i] },
        data: { sortOrder: i },
      });
    }

    return { message: 'Images reordered successfully' };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private validateImage(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }
  }

  private async processAndSaveImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<ProcessedImage> {
    // Create directory path: uploads/folder/YYYY/MM
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativePath = `${folder}/${year}/${month}`;
    const dirPath = join(process.cwd(), this.uploadDir, relativePath);

    // Ensure directory exists
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // Generate unique filename
    const uniqueId = this.generateId();
    const mainFilename = `${uniqueId}.webp`;
    const thumbFilename = `${uniqueId}-thumb.webp`;

    const mainPath = join(dirPath, mainFilename);
    const thumbPath = join(dirPath, thumbFilename);

    // Process main image
    const sharpInstance = sharp(file.buffer);
    const metadata = await sharpInstance.metadata();

    // Resize if needed and convert to WebP
    let processedImage = sharpInstance;
    if (metadata.width && metadata.width > MAX_IMAGE_WIDTH) {
      processedImage = processedImage.resize(MAX_IMAGE_WIDTH, null, {
        withoutEnlargement: true,
      });
    }

    const mainBuffer = await processedImage
      .webp({ quality: IMAGE_QUALITY })
      .toBuffer();

    await writeFile(mainPath, mainBuffer);

    // Generate thumbnail
    const thumbBuffer = await sharp(file.buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();

    await writeFile(thumbPath, thumbBuffer);

    // Get final dimensions
    const finalMeta = await sharp(mainBuffer).metadata();

    return {
      filename: mainFilename,
      path: `/${this.uploadDir}/${relativePath}/${mainFilename}`,
      url: `${this.baseUrl}/${this.uploadDir}/${relativePath}/${mainFilename}`,
      thumbnailUrl: `${this.baseUrl}/${this.uploadDir}/${relativePath}/${thumbFilename}`,
      width: finalMeta.width || 0,
      height: finalMeta.height || 0,
      size: mainBuffer.length,
    };
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  // FIX: Renamed to formatResponse and using explicit type
  private formatResponse(image: {
    id: string;
    originalName: string;
    url: string;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    size: number;
  }): ImageResponseDto {
    return {
      id: image.id,
      originalName: image.originalName,
      url: image.url,
      thumbnailUrl: image.thumbnailUrl ?? undefined,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      size: image.size,
    };
  }
}
