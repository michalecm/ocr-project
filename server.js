const express = require('express');
const app = express();
const multer = require('multer');
const mycv = require('./ocv.module');
const Tesseract = require('tesseract.js');


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
            console.log(imgToProc);
            (async () => {
                await worker.load();
                await worker.loadLanguage('hun');
                await worker.initialize('hun');
                const { data: { text } } = await worker.recognize(imgToProc);
                console.log(text);
                await worker.terminate();
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