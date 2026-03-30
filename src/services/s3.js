import axios from "axios";
import { Storage } from "aws-amplify";

export const uploadToS3 = async (signedUrl, file) => {
  await axios.put(signedUrl, file, {
    headers: { "Content-Type": file.type },
  });
};

// Returns a presigned GET URL for an image stored directly in the bucket
// (bypassing Amplify's level prefix by setting customPrefix to empty string)
export const getImageUrl = (key) =>
  Storage.get(key, {
    customPrefix: { public: "", protected: "", private: "" },
  });
