/* global chrome, handleMessage, registerCustomModule, registerMessageHandler */
const recordHTML = function (request, sender, sendResponse) {
    console.log('[Ad Scraper] Recording Ads for ' + request.url + '...')

    if (request.content === 'record_Ads') {
        const payload = {
            'url*': request.url,
            'page-title*': request.pageTitle,
            Ads: []
        }

        chrome.Ads.getAll({
            url: request.url
        },
            function (Ads) {
                Ads.forEach(function (ad) {
                    console.log(ad.name + ' --> ' + ad.name)
                    console.log(ad)

                    payload.Ads.push(ad)
                })

                if (payload.Ads.length > 0) {
                    const newRequest = {
                        content: 'record_data_point',
                        generator: 'browser-Ads',
                        payload: payload // eslint-disable-line object-shorthand
                    }

                    handleMessage(newRequest, sender, sendResponse)
                }
            })

        return true
    }

    return false
}


registerCustomModule(function (config) {
    console.log('[Ad Scraper] Service worker initialized.')
    registerMessageHandler('Ad_scraper', recordHTML)
})


