const fetch = require("node-fetch");
const xpath = require("xpath")
const dom = require('xmldom').DOMParser
const fs = require('fs');

const fetchDetails = require('./aggregator').fetchDetails
const headers = require('./aggregator').headers
const filename = require('./aggregator').filename

const PREFIX = 'https://amazon.in'

const search_page_url = [
    "https://www.amazon.in/s?k=samsung+split+ac+1.5+ton+5+star&i=kitchen&rh=n%3A3474656031%2Cp_n_feature_eleven_browse-bin%3A2753098031%2Cp_72%3A1318477031&dc&crid=38PBPKRGYG0VE&qid=1611393857&rnid=1318475031&sprefix=samsung+split+ac%2Caps%2C283&ref=sr_nr_p_72_2",
    "https://www.amazon.in/s?k=samsung+split+ac+1.5+ton+5+star&i=kitchen&rh=n%3A3474656031%2Cp_n_feature_eleven_browse-bin%3A2753098031%2Cp_72%3A1318477031&dc&page=2&crid=38PBPKRGYG0VE&qid=1611462461&rnid=1318475031&sprefix=samsung+split+ac%2Caps%2C283&ref=sr_pg_2",
    "https://www.amazon.in/s?k=samsung+split+ac+1.5+ton+5+star&i=kitchen&rh=n%3A3474656031%2Cp_n_feature_eleven_browse-bin%3A2753098031%2Cp_72%3A1318477031&dc&page=3&crid=38PBPKRGYG0VE&qid=1611462461&rnid=1318475031&sprefix=samsung+split+ac%2Caps%2C283&ref=sr_pg_3",
    "https://www.amazon.in/s?k=samsung+split+ac+1.5+ton+5+star&i=kitchen&rh=n%3A3474656031%2Cp_n_feature_eleven_browse-bin%3A2753098031%2Cp_72%3A1318477031&dc&page=4&crid=38PBPKRGYG0VE&qid=1611462461&rnid=1318475031&sprefix=samsung+split+ac%2Caps%2C283&ref=sr_pg_4",
    
]

function processUrls() {
    let all_urls = search_page_url.map(link => {
        return fetch(link, {headers})
            .then(response => response.text())
            .then(response => {
                let d = new dom({errorHandler: function(){}})
                return d.parseFromString(response)
            })
            .then(res => {
                let heads = xpath.select('//h2[@class="a-size-mini a-spacing-none a-color-base s-line-clamp-2"]/a/@href', res)            
                let urls = heads.map(h => PREFIX + h.value)
                return urls
            })
            .then(u => {
                let urls = u.map(h => {
                    if (h.startsWith(PREFIX + '/gp/slredirect')) {
                        let u = new URL(h)
                        let url = u.searchParams.get('url')
                        if (url) {
                            return PREFIX + url
                        }
                    }
                    return h
                })
                
                return urls
            }) 
            .catch(e => console.error(e))
        })

    Promise.all(all_urls)
        .then(u => Array.prototype.concat(...u))
        .then(u => {
            console.log('Discovered ' + u.length + ' products')
            console.log('Fetching details..')
            fetchDetails(u)
        })
        .catch(e => console.error('Something went wrong when fetching details: ', e))
}

fs.rm(filename, () => {
    console.log('Cleared existing data')
    console.log('Discovering products...')
    processUrls()
})