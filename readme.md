# PixelArt - Image Processing API

A Node.js backend for the **PixelArt** React application, enabling image upload and processing features. This API supports operations like brightness, contrast, saturation, rotation, and cropping using **Sharp**.

## Features

- **Image Upload:** Accepts `.png`, `.jpg`, and `.jpeg` formats.
- **Image Processing:**
  - Adjust brightness
  - Adjust contrast
  - Adjust saturation
  - Rotate image
  - Crop image
- **Download Processed Images:** After applying any image operation, users can download the final image.

## Technologies Used

- **Node.js** with **Express.js**
- **Sharp** for image processing
- **Multer** for file uploads
- **CORS** for handling cross-origin requests
- **Temporary file storage** for uploaded images

## Endpoints

### Image Upload
`POST /upload`  
Uploads an image and processes it.  
- **Request:** `multipart/form-data` with a field `image`
- **Response:** 
  ```json
  {
    "previewImage": "<base64_string>",
    "metaData": {...},
    "imageName": "filename.jpg"
  }

### Save Action
`POST /saveAction`
Applies an image operation (brightness, saturation, contrast, rotation, or crop).

- **Request:** 
    ```json

    {
    "action": "brightness",
    "value": 10,
    "isSmallScreen": false
    }


- **Response:** Updated image previews in base64.
    ```json
    {
        "previewImage": "<base64_string>",
        "metaData": {...},
        "imageName": "filename.jpg"
    }

### Specific Adjustments
`POST /brightness`
`POST /contrast`
`POST /saturation`
`POST /rotate`
Each accepts relevant values and returns updated image previews.

### Download Image
`POST /download`
Downloads the processed image after modifications.

- **Request:** 
  ```json
    { "isSmallScreen": true }


- **Response:** Base64 string of the final image.
   
### Setup Instructions
1. Clone the Repository:

    ```bash

        git clone <repo_url>
        cd <repo_name>

2. Install Dependencies:

    ```bash
        npm install

3. Start the Server:

    ```bash
    node app.js


4. Test the API: You can use Postman or any other API testing tool to interact with the endpoints.

5. Frontend Integration: The backend is designed to work with the PixelArt React app, which sends requests to this API for image processing.

### Notes
- The application temporarily stores uploaded images in the uploads directory.
- Ensure your React app is set up to handle image uploads and interact with the backend via API requests.

### License
- This project is open-source and free to use.