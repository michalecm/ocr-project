const { createScheduler } = require('tesseract.js');
const Tesseract = require('tesseract.js');

async function grabTxt(img){
    const rectangles = [
        {
            left: 0,
            top: 0,
            width: img.width, 
            height: img.height/2,
        }, {

            left: 0,
            top: img.height/2,
            width: img.width, 
            height: img.height/2,
        },
    ];

    const worker1 = Tesseract.createWorker();
    const worker2 = Tesseract.createWorker();
    const scheduler = createScheduler();
    await worker1.load();
    await worker2.load();
    await worker1.loadLanguage('hun');
    await worker2.loadLanguage('hun');
    await worker1.initialize('hun');
    await worker2.initialize('hun');
    scheduler.addWorker(worker1);
    scheduler.addWorker(worker2);
    const results = await Promise.all(rectangles.map((rectangle) => (
        scheduler.addJob('recognize', img, {rectangle})
    )));
    await scheduler.terminate();
    return results;
}

function txtReformat(txt) {
    
    
}



module.exports = {
    recognizeImage: _recognizeImage
}