const { Router } = require('express')
const router = Router()
const controller = require('./controller')
router
  .use('/proxy', controller.proxy)
  .use('/sockjs-node', controller.proxy)
  .get('/install', controller.install) // This is when visiting URL used to install your app and open it the Zoom client's embedded browser
  .get('/auth', controller.auth) // This is OAuth Redirect URL Entered In Zoom APP Marketplace App and when you click the Test Button
  .get('/home', controller.home) // This Route is triggered via Home URL Entered In Zoom APP Marketplace App
  .get('/authorize', controller.inClientAuthorize) 
  .post('/onauthorized', controller.inClientOnAuthorized) // This is called when the user authorizes the app in-client via the Authorize Button 

module.exports = router
