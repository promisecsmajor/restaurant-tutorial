//get a string and convert it to a mongodb Id
import mongodb from "mongodb"
const ObjectId = mongodb.ObjectID

let reviews

export default class ReviewsDAO{
    static async injectDB(conn){
        if (reviews) {
            return
        }
        try {
            reviews = await conn.db(process.env.RESTTUTORIALS_NS).collection("reviews")
        } catch (e){
            console.error(`unable to establish collection handles in userDAO: ${e}`)
        }
    }

    static async addReview (restaurantId, user, review, date){
        // Create an objectID and insert it into the database
        const reviewDoc = {
            name: user.name,
            user_id: user._id,
            date: date,
            text: review,
            restaurant_id: ObjectId(restaurantId),
        }
        try{
            return await reviews.insertOne(reviewDoc)
        } catch (e) {
            console.error(`Unable to post review: ${e}`)
            return { error: e}
        }
    }

    static async updateReview(reviewId, userId, text, date) {
        // Look for a review that has the correct user id and set the new text and date
        try{
            const updateResponse = await reviews.updateOne(
                { user_id: userId, _id: ObjectId(reviewId)},
                { $set: { text: text, date: date } },
            )
            return updateResponse
        } catch (e) {
            console.error(`Unable to update review ${e}`)
            return { error: e}
        }
    }

    static async deleteReview(reviewId, userId) {
        // Look for a review that has the id and also the user id, same user that created the review
        try{
            const deleteResponse = await reviews.deleteOne({
                _id: ObjectId(reviewId),
                user_id: userId,
            })
            return deleteResponse
        } catch (e) {
            console.error(`Unable to delete review ${e}`)
            return { error: e}
        }
    }
}