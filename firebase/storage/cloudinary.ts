import axios from "axios";

// Cloudinary Credentials
const CLOUD_NAME = "dxvyqpj2h"; // Your Cloudinary cloud name
const UPLOAD_PRESET = "profile-pic"; // Your Cloudinary upload preset

export const uploadImageToCloudinary = async (imageUri: string) => {
  const formData = new FormData();

  // ✅ Append image correctly for React Native
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "profile_pic.jpg",
  } as any); // ✅ Casting as 'any' to bypass TypeScript restrictions

  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("cloud_name", CLOUD_NAME);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data.secure_url; // ✅ Returns the uploaded image URL
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return null;
  }
};

// ✅ Helper function to get public_id from URL
export const getPublicIdFromUrl = (url: string) => {
  try {
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0];
    return `profile-pic/${publicId}`; // Include folder name to match upload_preset
  } catch (error) {
    console.error("Error extracting public_id from URL:", error);
    return null;
  }
};

// ✅ Delete image from Cloudinary
export const deleteImageFromCloudinary = async (publicId: string) => {
  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data.result === 'ok';
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
};