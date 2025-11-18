// app/api/protected/teacher/subject/resources/upload/route.js - FIXED AUTH
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary-config';
import { prisma } from '@/lib/prisma';

// GET endpoint to fetch resources
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { 
        role: true,
        schoolId: true,
        teacherProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || user.role !== 'teacher' || !user.teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can access resources' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    // Build where clause
    const where = {
      schoolId: user.schoolId,
      uploadedById: currentUser.id, // Only show resources uploaded by this teacher
    };

    if (folderId && folderId !== 'all') {
      where.folderId = folderId;
    } else if (!folderId) {
      where.folderId = null; // Root level resources
    }

    // Fetch resources
    const resources = await prisma.resource.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Fetch folders for this teacher
    const folders = await prisma.resourceFolder.findMany({
      where: {
        schoolId: user.schoolId,
        createdById: currentUser.id
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        resources,
        folders
      }
    });

  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch resources',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get current user from session (consistent with assignments route)
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { 
        role: true,
        schoolId: true,
        teacherProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || user.role !== 'teacher' || !user.teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can upload resources' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const name = formData.get('name');
    const folderId = formData.get('folderId');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Resource name is required' },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder based on file type
    const mimeType = file.type;
    let cloudinaryFolder = 'school-management/resources';
    
    if (mimeType.startsWith('image/')) {
      cloudinaryFolder += '/images';
    } else if (mimeType.startsWith('video/')) {
      cloudinaryFolder += '/videos';
    } else if (mimeType.includes('pdf')) {
      cloudinaryFolder += '/documents';
    } else {
      cloudinaryFolder += '/files';
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      `data:${mimeType};base64,${buffer.toString('base64')}`,
      {
        folder: cloudinaryFolder,
        resource_type: 'auto',
        public_id: `${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
      }
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: 'Upload to cloud storage failed' },
        { status: 500 }
      );
    }

    // Save resource to database
    const resource = await prisma.resource.create({
      data: {
        name,
        originalName: file.name,
        filename: `${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
        url: uploadResult.url,
        mimeType: mimeType || 'application/octet-stream',
        size: file.size,
        uploadedById: currentUser.id,
        schoolId: user.schoolId,
        folderId: folderId || null,
      },
    });

    console.log('Resource created successfully:', {
      id: resource.id,
      name: resource.name,
      uploadedById: resource.uploadedById,
      schoolId: resource.schoolId,
      folderId: resource.folderId
    });

    return NextResponse.json({
      success: true,
      data: { resource },
      message: 'Resource uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload resource', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing resources
export async function DELETE(request) {
  try {
    // Get current user from session (consistent with assignments route)
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { 
        role: true,
        schoolId: true,
        teacherProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || user.role !== 'teacher' || !user.teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can delete resources' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Get resource to verify ownership and get cloudinary ID
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Verify teacher owns this resource (using uploadedById from schema)
    if (resource.uploadedById !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this resource' },
        { status: 403 }
      );
    }

    // Verify resource belongs to teacher's school
    if (resource.schoolId !== user.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Resource does not belong to your school' },
        { status: 403 }
      );
    }

    // Delete from Cloudinary (extract public_id from URL)
    try {
      const { deleteFromCloudinary } = await import('@/lib/cloudinary-config');
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
      const urlParts = resource.url.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Get everything after version number, remove file extension
        const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension
        
        const resourceType = resource.mimeType.startsWith('video/') ? 'video' : 
                           resource.mimeType.startsWith('image/') ? 'image' : 'raw';
        
        await deleteFromCloudinary(publicId, resourceType);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await prisma.resource.delete({
      where: { id: resourceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete resource',
        details: error.message 
      },
      { status: 500 }
    );
  }
}