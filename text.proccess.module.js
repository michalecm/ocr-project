const e = require("express");
const { MongooseDocument, PromiseProvider } = require("mongoose");
const { findFundamentalMat } = require("opencv4nodejs");
const fs = require("fs")
class TextProcessor { 

    receiptPreProc;

    WORDARRAYS = {
        ADOSZAM : ['ALDÓSZÁM', 'ADÓSZÁM', 'ÁDÓSZÁM', 'ADOSZÁM'],
        OSSZESEN : ['ÖSSZESEN', 'ÖGSZEGEN', 'ÖS9/ESEN', 'Ö99/ESEN', 'ŐSSZES'],
        BANKKARTYA : ['BANKKÁRTYA', 'BANKKÁRTYA', 'BANKKÁRTYÁ', 'BDANKKÁRTYA'],
        NYUGTASZAM : ['NYUGTASZÁM', 'NYUGTASZÁM']
    }

    receiptSections = {
        ADOSZAM : {
            index : -1,
            content: []
        },
        OSSZESEN : {
            index : -1,
            content : []
        },
        BANKKARTYA : {
            index : -1,
            content : []
        },
        NYUGTASZAM : {
            index : -1,
            content : []
        }
    }

    receiptPostProc = {
        purchaseStoreID: ' ',
        purchaseStore : ' ',
        purchaseItems : {},
        purchaseTotal : 0,
        purchaseDate : ' '
    }

    constructor(receiptData, store) {
        this.receiptPreProc = receiptData.split("\n");
        this.receiptPostProc.purchaseStore = store;
    }

    findIndexes(){
        this.receiptPreProc.forEach((line, i) => {
            for (var section in this.WORDARRAYS) {
                var wordMatches = this.WORDARRAYS[section];
                if(this.receiptSections[section].index === -1){
                    if(wordMatches.some(word => line.includes(word))){
                        console.log(`${wordMatches} checking against ${line}`)
                        console.log(`Setting ${section} -- ${this.receiptSections[section].index} to ${i}`)
                        this.receiptSections[section].index = i;
                        console.log('poop2')

                    }else {console.log('poop not work')}
                }
            }
        });
    }

    goodToGo(){
        if(this.receiptSections.ADOSZAM.index > -1 &&
            this.receiptSections.NYUGTASZAM.index > -1 &&
            (this.receiptSections.OSSZESEN.index > -1 || this.receiptSections.BANKKARTYA.index > -1)){
                if(this.receiptSections.OSSZESEN.index === -1){
                    delete this.receiptSections.OSSZESEN;
                }
                if(this.receiptSections.BANKKARTYA.index === -1){
                    delete this.receiptSections.BANKKARTYA;
                }

                return true;
            }

        return false;
    }
        

    splitReceipt(){
        if(!this.goodToGo()){
            console.log("WE ARE REACHING THIS THROW STATEMENT POOPY PANTS")
            throw "Cannot process receipt because the data is incomplete"
        }

        let partsIndex = 0;
        var keys = Object.keys(this.receiptSections);
        for(let x = 0; x < this.receiptPreProc.length; x++){
            // console.log(this.receiptSections[keys[partsIndex]])
            // console.log(this.receiptSections[keys[partsIndex]].index)
            if(this.receiptSections[keys[partsIndex]].index === -1 && partsIndex <= keys.length-1){
                partsIndex += 1;
                continue;
            }else if(x === this.receiptSections[keys[partsIndex]].index + 1 && partsIndex < keys.length-1){
                console.log(`Because ${x} === ${keys[partsIndex]}'s index of ${this.receiptSections[keys[partsIndex]].index}
                and because ${partsIndex} < ${keys.length-1}, we are increasing ${partsIndex} by 1`)
                partsIndex += 1;
            }
            console.log(`Adding ${this.receiptPreProc[x]} to ${keys[partsIndex]}`)
            this.receiptSections[keys[partsIndex]].content.push(this.receiptPreProc[x])
            if(partsIndex -1 === keys.length-1){break;}
            console.log(`${partsIndex}-1 ==? ${keys.length}-1 ??? let us break`)
            if(x === this.receiptSections[keys[partsIndex]].index + 1 && partsIndex === keys.length - 1){break;}
        }  
    }

    processAdoszam(){
        console.log("this work 1")
        let tmp = this.receiptSections.ADOSZAM.content[this.receiptSections.ADOSZAM.content.length-1];
        console.log("this work 2 --   " + tmp)
        tmp = tmp.substring(tmp.lastIndexOf(":"+1), tmp.length).trim().replace(/\D/g,'');
        console.log('this work 3')
        this.receiptPostProc.purchaseStoreID = tmp;
    }
    
    processOsszesen(){
        let filters = ["m !", "nyugta"]
        let products = {};
        let total = 0;
        console.log('entering processOsszesen')
        if(filters.some(word => this.receiptSections.OSSZESEN.content[0].includes(word))){
            console.log("we are removing the NYUGTA or random !m line")
            this.receiptSections.OSSZESEN.content.shift();
        }
        const regex = /[A-Z]+[0-9]/g;
        for(let x = 0; x < this.receiptSections.OSSZESEN.content.length; x++) {
            console.log("entering processing loop for items")
            let tmp = this.receiptSections.OSSZESEN.content[x].replace(/[^a-zA-Z0-9 ]/g, "").trim().split(" ")
            console.log('this is TMP  -- ' + tmp)
            if(x === this.receiptSections.OSSZESEN.content.length-1){
                console.log('we are on the last item of the array')
                x++
            }
            //is there at least 2 lines left?
            else if(!(x+1 >= this.receiptSections.OSSZESEN.content.length)){
                console.log('there are at least 2 items left in the array')
                let tmp2 = this.receiptSections.OSSZESEN.content[x+1].replace(/[^a-zA-Z0-9 ]/g, "").trim().split(" ")
                console.log('this is the next line  '  + tmp2)
                console.log(tmp[0].match(regex))
                console.log(`tmp first 3 chars ${tmp[0]} is/isnot matching ${regex} --- ${tmp[0].match(regex)}`)
                //is our first string in the array 3 characters??
                let count = 0;
                tmp.forEach(word => {word.search(regex) === -1 ? count++ : count = count})
                if(count > 0)
                if(tmp[0].length === 3 && ((tmp[0].match(regex) !== null) || (tmp[0].match(/[A-Z]{3}/g) !== null))){
                    console.log('the first string in our line is 3 characters long, so we are removing it')
                    try{tmp.shift()}
                    catch{(err) => {
                        console.log("my big stinky poopy pants")
                    }};
                    console.log("shifted")
                    //is our second line's first string 3 characters?????
                    // console.log(
                    //     `is our second string three characters? (we want false for single line) --- ${!(tmp2[0].length === 3)}\n` +
                    //     `are those three characters matching regex? (we want false for single line) --- ${!(tmp2[0].match(regex).length > 0)}`
                    // )
                    if((tmp2[0].length !== 3 && tmp2[0].match(regex) === null)){
                        console.log('the first 3 characters of tmp2 are not matching our regex, so this is a 2-line product')
                        console.log(`${tmp2[0].length}  ---- ${tmp2[0].match(regex)}`)
                        console.log(`tmp2  --- ${tmp2[0]}`)
                        //if it is no
                    //in here this means that we have a 2-line product
                    //we need to process the 2 lines
                        let price = '';
                        let name = ''

                        //two-line product
                        //has a thousands place
                        //check if price is >1k
                        //if it is there is a space between the thousands and hundreds, combine them
                        //else just use the last index
                        if(tmp2[tmp2.length-2].length === 1){
                            price = tmp2.splice(tmp2.length-2, tmp2.length).join("").replace(/\D/g,'')
                            name = tmp.splice(0, tmp.length).join(" ")
                            if(!products[name]){
                                products[name] = []
                            }
                            products[name].push(price)
                            console.log(`We had two line product with thousands place\nNAME: ${name} --- PRICE: ${price}`)

                        }else {
                            price = tmp2[tmp2.length-1].replace(/\D/g,'')
                            name = tmp.splice(0, tmp.length).join(" ")
                            if(!products[name]){
                                products[name] = []
                            }
                            products[name].push(price)
                            console.log(`We had two line product\nNAME: ${name} --- PRICE: ${price}`)

                        }
                    
                    }else {
                        console.log("first three chars of next line did not match regex")
                        let price = ''
                        let name = ''
                        //we have a single line product
                        //price has a thousands place
                        if(tmp[tmp.length-2].length === 1){
                            price = tmp.splice(tmp.length-2, tmp.length).join("").replace(/\D/g,'')
                            name = tmp.splice(0, tmp.length-2).join(" ")
                            if(!products[name]){
                                products[name] = []
                            }
                            products[name].push(price)
                            console.log(`We had single line product with thousands place\nNAME: ${name} --- PRICE: ${price}`)
                        }else {
                            price = tmp[tmp.length-1].replace(/\D/g,'')
                            name = tmp.splice(0, tmp.length-1).join(" ")
                            if(!products[name]){
                                products[name] = []
                            }
                            products[name].push(price)
                            console.log(`We had single line product\nNAME: ${name} --- PRICE: ${price}`)
                        }
                        
                    }
                }
            
            }    
        }

        this.receiptPostProc.purchaseItems = Object.assign({}, products)
        console.log("ssg")
        
        for(product in products){
            console.log(`${product} --- ${products[product]}`)
        }
    }

    processBankkartya(){
        let total = this.receiptSections.BANKKARTYA.content[0].trim().replace(/\D/g,'').replace(/\s/g,'')
        this.receiptPostProc.purchaseTotal = total
        console.log(total)
    }
    processNyugatszam(){
        let newIndex = this.receiptSections.NYUGTASZAM.index - (this.receiptSections.ADOSZAM.content.length + this.receiptSections.OSSZESEN.content.length +
        this.receiptSections.BANKKARTYA.content.length-3)
        console.log(this.receiptSections.NYUGTASZAM.content[newIndex])
    }

    processReceiptSegments(){
        console.log("calling process ADOSZAM")
        this.processAdoszam()
        console.log("FINISHED calling process ADOSZAM")
        console.log("calling process OSSZESEN")
        this.processOsszesen()
        console.log("finishing calling process OSZESSEN")
        this.processBankkartya()
        this.processNyugatszam()
    }


    toString() {
        console.log('this okay')
        var keys = Object.keys(this.receiptSections)
        console.log(keys)
        for(var key of Object.keys(this.receiptSections)){      
            console.log(key + "  ---  " + this.receiptSections[key].index + "  ---  " + this.receiptSections[key].content)
        }
    }      
}

module.exports = {
    TextProcessor
}
    