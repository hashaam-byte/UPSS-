// lib/cloudinary-config.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadToCloudinary(file, options = {}) {
  try {
    const defaultOptions = {
      folder: options.folder || 'school-management',
      resource_type: options.resource_type || 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const result = await cloudinary.uploader.upload(file, {
      ...defaultOptions,
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate signed upload URL for client-side uploads
 * @param {Object} options - Upload preset options
 * @returns {Object} Signed upload parameters
 */
export function generateUploadSignature(options = {}) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    upload_preset: options.upload_preset || 'school_resources',
    folder: options.folder || 'school-management',
    ...options
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    ...params
  };
}

export default cloudinary;