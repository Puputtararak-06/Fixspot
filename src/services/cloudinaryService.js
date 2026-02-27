const CLOUDINARY_CLOUD_NAME = 'dhz07lnaf'
const CLOUDINARY_UPLOAD_PRESET = 'fixspot_unsigned'

export const uploadImage = async (imageUri) => {
  const formData = new FormData()
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg'
  })
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  const data = await response.json()
  return data.secure_url
}
