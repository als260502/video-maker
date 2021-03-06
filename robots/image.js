const imageDownloader = require('image-downloader')
const gm = require('gm').subClass({imageMagick: true})
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')
async function robot(){
    const content = state.load()

    await fetchImagesOfAllSentences(content)
    await downloadAllImags(content)
    
    state.save(content)

    async function fetchImagesOfAllSentences(cotent){
        for (const sentence of content.sentences){
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await fetchGoogleAndReturnImageLinks(query)
            sentence.googleSeachQuery = query
        }
    }
    
    async function fetchGoogleAndReturnImageLinks(query){

        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apiKey,
            cx: googleSearchCredentials.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2
        })

        const imagesUrl = response.data.items.map((item)=>{
            return item.link
        })

        return imagesUrl
    }

    async function downloadAllImags(content){
        content.downloadedImages = []


        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){

            const images = content.sentences[sentenceIndex].images

            for (let imageIndex = 0; imageIndex < images.length; imageIndex++){
              const imageUrl = images[imageIndex]  
              
              try{
                  if (content.downloadedImages.includes(imageUrl)){
                      throw new Error('imagem ja foi naixada')
                  }
                await downloadAndSave(imageUrl, `${sentenceIndex}-original.png`)
                content.downloadedImages.push(imageUrl)
                console.log(`> [${sentenceIndex}][${imageIndex}] Baixou imagem comsucesso: ${imageUrl}`)
                break

              }catch(error){
                  console.log(`> [${sentenceIndex}][${imageIndex}] Erro ao baixar (${imageUrl}): ${error}`)
              }

            }
        }
    }

    async function downloadAndSave(url, fileName){
        return imageDownloader.image({
            url: url,
            dest: `./content/${fileName}`
        })
    } 
    
}

module.exports = robot