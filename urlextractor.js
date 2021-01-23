const fetch = require("node-fetch");
const xpath = require("xpath")
const dom = require('xmldom').DOMParser
const fetchDetails = require('./aggregator').fetchDetails
const headers = require('./aggregator').headers

const PREFIX = 'https://amazon.in'

const search_page_url = [
    "https://www.amazon.in/s?k=samsung+split+ac+1.5+ton+5+star&i=kitchen&rh=n%3A3474656031%2Cp_n_feature_eleven_browse-bin%3A2753098031%2Cp_72%3A1318477031&dc&crid=38PBPKRGYG0VE&qid=1611393857&rnid=1318475031&sprefix=samsung+split+ac%2Caps%2C283&ref=sr_nr_p_72_2",
]

search_page_url.map(link => {
    fetch(link, {headers})
        .then(response => response.text())
        .then(response => {
            let d = new dom()
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
            
            console.log(urls.length)
            return urls
        }) 
        .then(urls => fetchDetails(urls))
        .catch(e => console.error(e))
    })

