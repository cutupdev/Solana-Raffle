import { Dispatch, FC, useState } from "react";
import ImageUploading, { ImageListType } from 'react-images-uploading';

type ImageProps = {
    setImage: Dispatch<React.SetStateAction<string>>;
}

const ImageUploader: FC<ImageProps> = ({ setImage }) => {

    const [images, setImages] = useState<ImageListType>([]);

    const handleUploadImage = async (images_: ImageListType, addUpdateIndex: any) => {
        setImages(images_);
        setImage(images_[0] ?  images_[0].data_url.split(',')[1] : '');
      }

    return (
        <ImageUploading
          value={images}
          onChange={handleUploadImage}
          maxNumber={1}
          dataURLKey="data_url"
        >
        {({
          imageList,
          onImageUpload,
          onImageRemoveAll,
          isDragging,
          dragProps,
        }) => (
          <div style={{margin:'15px 0'}}>
             {imageList.length == 0 &&
            <button
              style={isDragging ? { border: '1px dashed black' } : undefined}
              onClick={onImageUpload}
              {...dragProps}
            >
              Click or Drop Image
            </button> }
            &nbsp;
            {imageList.length > 0 && <button className={'button_danger'} onClick={onImageRemoveAll}>Remove</button>}
            &nbsp;
            { imageList.length > 0 && imageList[0].file?.name}
          </div>
        )}
      </ImageUploading>
    )
}

export default ImageUploader;