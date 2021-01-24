const fetch = require("node-fetch");
const xpath = require("xpath")
const dom = require('xmldom').DOMParser
const fs = require('fs');

const filename = 'details.csv'
const SR_NO = "Sr No"
const PRICE = "Price"
const NAME = 'Name'

let headers = {
    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
    "Upgrade-Insecure-Requests": "1",
    "Connection": "close"
}

function fetchDetails(link_array) {
    let srno = 0
    let collection = link_array.map(link => {
        return fetch(link, {headers})
            .then(response => response.text())
            .then(response => {
                let d = new dom({errorHandler: function(){}})
                return d.parseFromString(response)
            })
            .then(res => {
                let item = {}
                item[SR_NO] = ++srno
    
                let name = xpath.select('//span[@id="productTitle"]', res, true)
                item[NAME] = name.textContent.trim()

                let price = xpath.select('//span[@id="priceblock_ourprice"]', res, true)            
                if (price) {
                    item[PRICE] = price.textContent.trim()
                } else {
                    let deal_price = xpath.select('//span[@id="priceblock_dealprice"]', res, true)
                    if (deal_price) {
                        item[PRICE] = deal_price.textContent.trim()
                    }
                }
                
                let table = xpath.select('//table[@id="productDetails_techSpec_section_1"]//tr', res)
                
                table.forEach(tr => {
                    let th = xpath.select('./th', tr, true)
                    let td = xpath.select('./td', tr, true)
                    
                    let heading = th.textContent.trim()
                    item[heading] = td.textContent.trim()
                })
    
                item["Link"] = link
                return item
            })
            .catch(err => console.log(err.stack))
    })
    
    Promise.all(collection)
        .then(items => {
            const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
            const header = Object.keys(items[0])
            let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
            csv.unshift(header.join(','))
            csv = csv.join('\r\n')
            fs.writeFileSync(filename, csv)
        })
        .catch(err => console.error(err))
}

module.exports = {fetchDetails, headers, filename}