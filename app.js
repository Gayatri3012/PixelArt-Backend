const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const tmp = require( 'tmp' );
const path = require('path')
const fs = require('fs').promises

const app = express();
const port = process.env.PORT || 8080;

var RECENT_UPLOADED_IMAGE = undefined;

app.use(cors());

var PROCESSED_IMAGE = undefined;
var SMALL_PROCESSED_IMAGE = undefined;
var IMAGE_FORMAT;

const fileStorage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${timestamp}-${file.originalname}`;
    console.log(filename)
    RECENT_UPLOADED_IMAGE = filename;
    cb(null, filename);
  }
})

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(express.json());

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });

app.get('/ping', (req, res) => {
  res.status(200).send('Server is awake');
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if(req.file) {
    const file = req.file;

    const metaData = await sharp(`./uploads/${RECENT_UPLOADED_IMAGE}`).metadata();

    var smallPreviewImage;
    var processedImage;

    if(metaData.format === 'jpeg' || metaData.format === 'jpg'){

      processedImage = await sharp(`./uploads/${RECENT_UPLOADED_IMAGE}`)
      .resize(700, 700,{
        fit: 'inside'
      })
      .jpeg({quality :100})
      .toBuffer();

      smallPreviewImage = await sharp(`./uploads/${RECENT_UPLOADED_IMAGE}`)
      .resize(300, 400,{
        fit: 'inside'
      })
      .jpeg({quality :100})
      .toBuffer();
    } else {

      processedImage = await sharp(`./uploads/${RECENT_UPLOADED_IMAGE}`) 
      .resize(700, 700, {
        fit: 'inside',
        position: 'center'
      })
      .png({quality :100})
      .toBuffer();

      smallPreviewImage = await sharp(`./uploads/${RECENT_UPLOADED_IMAGE}`)
      .resize(300, 400,{
        fit: 'inside'
      })
      .png({quality :100})
      .toBuffer();
    }


    PROCESSED_IMAGE = processedImage;
    SMALL_PROCESSED_IMAGE = smallPreviewImage;
    IMAGE_FORMAT = metaData.format;
    res.send({
      previewImage: processedImage.toString('base64'),
      smallPreviewImage: smallPreviewImage.toString('base64'),
      metaData, 
      imageName: RECENT_UPLOADED_IMAGE 
    });
   
  } else {
    console.log('no file uploaded')
  }
})



app.post('/saveAction', async(req, res) => {
  const {action, value, isSmallScreen} = req.body;
  var processedImageBuffer = await sharp(PROCESSED_IMAGE).toBuffer();
  var smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE).toBuffer();

  if(action === 'brightness'){
    processedImageBuffer = await sharp(PROCESSED_IMAGE)
    .modulate({
      lightness: value
    })
    .toBuffer();

    smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
    .modulate({
      lightness: value
    })
    .toBuffer();

  } else if(action === 'saturation'){
    processedImageBuffer = await sharp(PROCESSED_IMAGE)
    .modulate({
      saturation: value
    })
    .toBuffer();

    smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
    .modulate({
      saturation: value
    })
    .toBuffer();

  } else if(action === 'contrast'){
    processedImageBuffer = await sharp(PROCESSED_IMAGE)
    .normalise({
      lower: value,
      upper: 100
    })
    .toBuffer()

    smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
    .normalise({
      lower: value,
      upper: 100
    })
    .toBuffer();

  } else if(action === 'rotation'){
    processedImageBuffer = await sharp(PROCESSED_IMAGE)
    .rotate(value)
    .toBuffer();

    smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
    .rotate(value)
    .toBuffer();

  } else if(action === 'crop'){
    console.log(value);
    if(value.width > 0 && value.height > 0){
        if(!isSmallScreen){
          processedImageBuffer = await sharp(PROCESSED_IMAGE)
          .extract({
            left: value.x,
            top: value.y,
            width: value.width,
            height: value.height
          })
          .toBuffer()
        }
        
        if(isSmallScreen){
          smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
          .extract({
            left: value.x,
            top: value.y,
            width: value.width,
            height: value.height
          })
          .toBuffer()
        }
    }
    
   
  }

  PROCESSED_IMAGE = processedImageBuffer;
  SMALL_PROCESSED_IMAGE = smallProcessedImageBuffer;

  if(IMAGE_FORMAT === 'png'){
    previewImageBuffer = await sharp(processedImageBuffer)
    .png({quality: 90})
    .toBuffer()

    smallPreviewImage =  await sharp(smallProcessedImageBuffer)
    .png({quality: 90})
    .toBuffer()
  
  } else {
    previewImageBuffer = await sharp(processedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()
  }

  res.json({
    previewImage: previewImageBuffer.toString('base64'),
    smallPreviewImage: smallPreviewImage.toString('base64'),
    message: 'Image updated successfully'
  });
})

app.post('/brightness', async (req, res) => {

  const {brightness} = req.body;
   var processedImageBuffer = await sharp(PROCESSED_IMAGE)
  .modulate({
    lightness: brightness
  }).toBuffer();

  var smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
  .modulate({
    lightness: brightness
  }).toBuffer();

  if(IMAGE_FORMAT === 'png'){
    previewImageBuffer = await sharp(processedImageBuffer)
    .png({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .png({quality: 90})
    .toBuffer()

  } else {
    previewImageBuffer = await sharp(processedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()
  }
 
  res.json({
    previewImage: previewImageBuffer.toString('base64'),
    smallPreviewImage: smallPreviewImage.toString('base64'),
    message: 'Image updated successfully'
  });
})

app.post('/contrast', async (req, res) => {

  const {contrast} = req.body;

  var processedImageBuffer = await sharp(PROCESSED_IMAGE)
  .normalise({
        lower: contrast,
        upper: 100
  })
  .toBuffer();

  var smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
  .normalise({
        lower: contrast,
        upper: 100
  })
  .toBuffer();

  if(IMAGE_FORMAT === 'png'){
    previewImageBuffer = await sharp(processedImageBuffer)
    .png({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .png({quality: 90})
    .toBuffer()

  } else {
    previewImageBuffer = await sharp(processedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()
  }

  res.json({
    previewImage: previewImageBuffer.toString('base64'),
    smallPreviewImage: smallPreviewImage.toString('base64'),
    message: 'Image updated successfully'
  });
  
})

app.post('/saturation', async (req, res) => {

  const { saturation } = req.body;

  let processedImageBuffer = await sharp(PROCESSED_IMAGE)
  .modulate({
    saturation: saturation/50
  })
  .toBuffer();

  let smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
  .modulate({
    saturation: saturation/50
  })
  .toBuffer();

  if(IMAGE_FORMAT === 'png'){
    previewImageBuffer = await sharp(processedImageBuffer)
    .png({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .png({quality: 90})
    .toBuffer()
  } else {
    previewImageBuffer = await sharp(processedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()
  }


  
  res.json({
    previewImage: previewImageBuffer.toString('base64'),
    smallPreviewImage: smallPreviewImage.toString('base64'),
    message: 'Image updated successfully'
  });
})


app.post('/rotate', async (req, res) => {
  
  const {rotation} = req.body;

  let processedImageBuffer = await sharp(PROCESSED_IMAGE)
  .rotate(rotation)
  .toBuffer();

  let smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
  .rotate(rotation)
  .toBuffer();

  if(IMAGE_FORMAT === 'png'){
    previewImageBuffer = await sharp(processedImageBuffer)
    .png({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .png({quality: 90})
    .toBuffer()
  } else {
    previewImageBuffer = await sharp(processedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()

    smallPreviewImage = await sharp(smallProcessedImageBuffer)
    .jpeg({quality: 90})
    .toBuffer()
  }

  res.json({
    previewImage: previewImageBuffer.toString('base64'),
    smallPreviewImage: smallPreviewImage.toString('base64'),
    message: 'Image updated successfully'
  });
})

app.post('/download', async (req, res) => {
  
  if(req.body.isSmallScreen){
    let smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
    .toBuffer();
    console.log(IMAGE_FORMAT)
    
    if(IMAGE_FORMAT == 'png'){
      smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
      .png({quality: 100})
      .toFormat('png')
      .toBuffer();
    } else {
      smallProcessedImageBuffer = await sharp(SMALL_PROCESSED_IMAGE)
      .jpeg({quality: 100})
      .toFormat('jpeg')
      .toBuffer();
    }
    
    res.json({
      downloadImage: smallProcessedImageBuffer.toString('base64'),
      message: 'Image downloaded successfully'
    });

  } else {

    let processedImageBuffer = await sharp(PROCESSED_IMAGE)
    .toBuffer();
    console.log(IMAGE_FORMAT)
    
    if(IMAGE_FORMAT == 'png'){
      processedImageBuffer = await sharp(PROCESSED_IMAGE)
      .png({quality: 100})
      .toFormat('png')
      .toBuffer();
    } else {
      processedImageBuffer = await sharp(PROCESSED_IMAGE)
      .jpeg({quality: 100})
      .toFormat('jpeg')
      .toBuffer();
    }
    
    res.json({
      downloadImage: processedImageBuffer.toString('base64'),
      message: 'Image downloaded successfully'
    });
    // if (RECENT_UPLOADED_IMAGE) {
    //   const filePath = path.join(__dirname, 'uploads', RECENT_UPLOADED_IMAGE);
    //   await fs.unlink(filePath);
    //   console.log(`Deleted file: ${RECENT_UPLOADED_IMAGE}`);
    // }
  }
})

  // app.post('/cancel', async (req, res) => {
  //   setTimeout(async () => {
  //     try{
      
  //       if (RECENT_UPLOADED_IMAGE) {
  //         console.log(RECENT_UPLOADED_IMAGE)
  //         const filePath = path.join(__dirname, 'uploads', RECENT_UPLOADED_IMAGE);
  //         await fs.unlink(filePath).catch(err => console.error('Error deleting file:', err));;
  //         console.log(`Deleted file: ${RECENT_UPLOADED_IMAGE}`);
  //       } 
  
  //       RECENT_UPLOADED_IMAGE = undefined;
  //       PROCESSED_IMAGE = undefined;
  //       SMALL_PROCESSED_IMAGE = undefined;
  //       IMAGE_FORMAT = undefined;
       
  //     }catch(err){
  //       console.error('Error during file deletion:', err);
  //       res.status(500).json({ message: 'Error processing the image' });
  //     }
  //   }, 3000); 
  // })



app.listen(port, () => {
  console.log('Server running');
})