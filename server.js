const express = require('express');
const app = express();
const multer = require('multer');
const mycv = require('./ocv.module');
const Tesseract = require('tesseract.js');
const fs = require('fs')
const { fastNlMeansDenoisingColored } = require('opencv4nodejs');
const tproc = require('./text.proccess.module')
var path = require('path');
const { TextProcessor } = require('./text.proccess.module');
//const __dirname = "/home/arvu/Desktop/web-app-ocr/backend"

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename : (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

app.post('/receipts/upload', upload.single('uploadedImage'),
     async (req, res) => {
        
        console.log(req.file)
        try {
            const worker = Tesseract.createWorker({
                logger : m => console.log(m)
            });

            let imgToProc = await mycv.processImg('uploads/'+req.file.filename);
            console.log(imgToProc[0]+imgToProc[1]+imgToProc[2]+imgToProc[3]);
            (async () => {
                await worker.load();
                await worker.loadLanguage('hun');
                await worker.initialize('hun');
                const { data: { text } } = await worker.recognize(imgToProc[0]+imgToProc[1]+imgToProc[2]+imgToProc[3]);
                //fs.writeFile('./data.txt', text);
                //console.log(text);
                await worker.terminate();
                fs.writeFileSync(path.join(__dirname, `/${imgToProc[1]+imgToProc[2]}.txt`), text, (err) => {console.log("error writing" + err)})
                console.log('good')
                let processor = new TextProcessor(text);
                console.log('constructed')
                processor.findIndexes();
                console.log('indeces found')
                processor.splitReceipt();
                console.log('receipt split')
                processor.processReceiptSegments();
                console.log('receipts parts process')
                //processor.toString();
                //console.log('tostring')
                res.set('content-type', 'application/json')
                res.set('charset', 'UTF-32')
                res.set('status', 200)
                res.json({
                    imgTxt : text
                });

                // res.end();

                res.send();
            })();
        }

        catch(error){
            console.log(error);
        }

        finally {
            console.log('finally')
        } 
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
})