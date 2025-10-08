import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    for (const file of files) {
      if (file.size === 0) continue;

      // Upload file to Cloudinary
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `resources/${user.schoolId}`,
            resource_type: 'auto',
            public_id: file.name.split('.').slice(0, -1).join('') // Remove file extension
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      // Create database record
      const resource = await prisma.resource.create({
        data: {
          name: file.name,
          originalName: file.name,
          filename: uploadResult.public_id,
          url: uploadResult.secure_url,
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
