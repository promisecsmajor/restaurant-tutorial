import mongodb from "mongodb"
const ObjectId = mongodb.ObjectID

// Reference to our Database
let restaurants

export default class RestaurantsDAO{
    // method called as soon as our server starts
    static async injectDB(conn) {
        if (restaurants){
            return
        }
        try {
            // restaurants = collection from mongoDB with the data
            restaurants = await conn.db(process.env.RESTTUTORIALS_NS).collection("restaurants")
        } catch (e) {
            console.error(
                `Unable to establish a collection handle in restaurantsDAO: ${e}`, 
            )
        }
    }
    // Get a list of all the restaurants in the DB
    static async getRestaurants({
        //options, filters = sortBy and defaults at page 0 with 20 restaurants per page

        filters = null,
        page = 0,
        restaurantsPerPage = 20,
    } = {}) {
        let query
        if (filters) {
            // search by name
            if ("name" in filters) {
                query = { $text: { $search: filters["name"] } }
            } 
            // search by cuisine
            else if ("cuisine" in filters) {
                query = { "cuisine": { $eq: filters["cuisine"] } }
            } 
            // search by zipcode
            else if ("zipcode" in filters) {
                query = { "address.zipcode": { $eq: filters["zipcode"] } }
            }
        }

        let cursor

        try{
            cursor = await restaurants
            // find all the restaurants from the DB w the query
            .find(query)
        } catch (e) {
            console.error( `unable to issue find command, ${e}`)
            return {restaurantsList: [], totalNumRestaurants: 0}
        }
        // limit to restaurants per page, and skip from the beginning
        const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)
        
        // set retaurantsList to an array and return it and the totalNum of restuarants
        try {
            const restaurantsList = await displayCursor.toArray()
            const totalNumRestaurants = await restaurants.countDocuments(query)

            return {restaurantsList, totalNumRestaurants}
        } catch (e) {
            console.error(
                `unable to convert cursor to array or problem counting document, ${e}`,
            )
            return { restaurantsList: [], totalNumRestaurants: 0}
        }
    }
    static async getRestaurantById(id){
        try{
            // Create a pipeline that will match different collections; First we try to macth the id of a certain restaurant
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                        {
                            // Then we lookup other items, which are reviews. **Aggregation pipeline** 
                            $lookup: {
                                from: "reviews",
                                let: {
                                    id: "$_id",
                                },
                                pipeline : [
                                    {
                                        $match: {
                                            // Find all reviews that match the restaurant id
                                            $expr: {
                                                $eq: ["$restaurant_id", "$$id"],
                                            },
                                        },
                                    },
                                    {
                                        $sort: {
                                            date: -1,
                                        },
                                    },
                                ],
                                // Set it to be reviews
                                as: "reviews",
                            },
                        },
                        {
                            // New thing the result called reviews
                            $addFields: {
                                reviews: "$reviews",
                            },
                        },
            ]
            return await restaurants.aggregate(pipeline).next()
        } catch(e) {
            console.error(`Something went wrong in getRestaurantByID: ${e}`)
            throw e
        }
    }

    static async getCuisines() {
        let cuisines = []
        try {
            cuisines = await restaurants.distinct("cuisine")
            return cuisines
        } catch (e) {
            console.error(`Unable to get cuisines, ${e}`)
            return cuisines
        }
    }
}