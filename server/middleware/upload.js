import multer from 'multer'
import { Readable } from 'stream'
import cloudinary from '../config/cloudinary.js'

const storage = multer.memoryStorage()

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

export const uploadToCloudinary = (buffer, folder = 'shoe-inventory') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err)
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    Readable.from(buffer).pipe(stream)
  })
}

export const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId)
}
