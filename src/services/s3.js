import axios from "axios";

export const uploadToS3 = async (signedUrl, file) => {
  await axios.put(signedUrl, file, {
    headers: { "Content-Type": file.type },
  });
};
