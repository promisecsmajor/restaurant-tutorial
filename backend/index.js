/* Import the server mongodb and dotenv */
import app from "./server.js"
import mongodb from "mongodb"
import dotenv from "dotenv"
import RestaurantsDAO from "./dao/restaurantsDAO.js"
import ReviewsDAO from "./dao/reviewsDAO.js"
//config the env variables
dotenv.config()
const MongoClient = mongodb.MongoClient


const port = process.env.PORT || 8000

//Connect to Database and pass in its environment variables: poolSize( amount of people that can connect at a time): wtimeout (2500 seconds before timeout)
MongoClient.connect(
    process.env.RESTTUTORIALS_DB_URI,
    {
        poolSize: 50,
        wtimeout: 2500,
        useNewUrlParse: true
    }
)
//Catch any errors in the connection
.catch(err => {
    console.error(err.stack)
    process.exit(1)
})
//After we've connect, we will listen to start the web server
.then(async client => {
    //get initial reference to the collection in the DB
    await RestaurantsDAO.injectDB(client)
    await ReviewsDAO.injectDB(client)
    app.listen(port, () => {
        console.log(`listening on port ${port}`)
    })
})
