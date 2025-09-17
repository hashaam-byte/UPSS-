import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const user = await requireAuth(['admin']);
    const formData = await request.formData();

    const files = formData.getAll('files');
    const folderId = formData.get('folderId');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate folder if provided
    if (folderId) {
      const folder = await prisma.resourceFolder.findFirst({
        where: {
          id: folderId,
          schoolId: user.schoolId
        }
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    const uploadedResources = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'resources');

    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists or permission error
    }

    for (const file of files) {
      if (file.size === 0) continue;

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadDir, uniqueFileName);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create database record
      const resource = await prisma.resource.create({
        data: {
          name: file.name,
          originalName: file.name,
          filename: uniqueFileName,
          url: `/uploads/resources/${uniqueFileName}`,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          schoolId: user.schoolId,
          uploadedById: user.id,
          folderId: folderId || null
        }
      });

      uploadedResources.push({
        id: resource.id,
        name: resource.name,
        url: resource.url,
        size: resource.size,
        mimeType: resource.mimeType
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedResources.length} file(s) uploaded successfully`,
      resources: uploadedResources
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
