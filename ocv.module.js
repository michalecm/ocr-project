const { THRESH_BINARY, THRESH_BINARY_INV, CV_16S, waitKey } = require('opencv4nodejs');
const cv = require('opencv4nodejs')
const { promisify } = require('util');
const fs = require('fs');
const convert = require('heic-convert');

async function convHEICtoPNG(img){
    const imgExt = '.PNG';
    const imgPath = img.substring(0, img.lastIndexOf('.')) + 'c2PNG';
    const inputBuffer = await promisify(fs.readFile)(img);
    const outputBuffer = await convert({
      buffer: inputBuffer, // the HEIC file buffer
      format: 'PNG'        // output format
    });
    
    console.log("ehrehrehreuhtuh")

    await promisify(fs.writeFile)(imgPath + imgExt, outputBuffer)
    console.log('jdsfjisf')
    return [imgPath, imgExt];
  } 

function processImg(img){
    const imgPath = img.substring(0, img.lastIndexOf('.'));
    const imgExt = img.substring(img.lastIndexOf('.'), img.length);
   // let fpath = [imgPath, imgExt]
   let fpath = [];
    console.log(imgPath + " " + imgExt)
    if(imgExt === ".HEIC"){
        console.log("ehrehreh633636reuhtuh")

        fpath = convHEICtoPNG(img);
        console.log(fpath)
    }

    do{
         console.log('we are waiting still....')
    }while(!fs.existsSync(fpath[0]+fpath[1]))
    
    // if(fs.existsSync(fpath[0]+fpath[1])){
    //     console.log("imread will be empty MAT")
    //     let src = cv.imread(fpath[0] + fpath[1]);
    //     let tmp = src.bgrToGray();
    //     let dest = tmp.threshold(220, 255, cv.THRESH_OTSU);
    //     cv.imwriteAsync(fpath[0] + 'c2BW' + fpath[1], dest)
    //     return fpath[0] + 'c2BW' + fpath[1];
    // }
    // else {}
    
    
}

module.exports = {
    processImg
}