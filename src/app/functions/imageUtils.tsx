import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export const getImageUrl = async (image: string) => {
      const storage = getStorage();
      const storageRef = ref(storage, image);
      const url = await getDownloadURL(storageRef);
      return url;
};

export const getImageUrls = async (imagePaths: string[]) => {
        const urls = await Promise.all(
            imagePaths.map(async (path) => {
                return await getImageUrl(path);
            })
        );
        return urls;
    }