<template>
<!-- Vue.js component to add a new product review to the database (via a
Stitch function). The review includes a rating which impacts the summary
review stats for the product and so those are passed back to the 
enclosing component. -->
    <div class="container" id="add-review">
        <div v-if="userLoggedIn" class="notification">
            <h1 class="title is-2">Review this product</h1>
            <textarea
                v-model="comment"
                class="textarea"
                id="comment"
                placeholder="Tell us what you think about this product"
            ></textarea>
            <br/>
            <div class="box">
                <div class="level-left">
                    <span v-on:click="setStars(1)">
                        <span v-if="stars >= 1" class="icon is-small has-text-warning">
                            <i class="fas fa-star"></i>
                        </span>
                        <span v-else class="icon is-small has-text-warning">
                            <i class="far fa-star"></i>
                        </span>
                    </span>
                    <span v-on:click="setStars(2)">
                        <span v-if="stars >= 2" class="icon is-small has-text-warning">
                            <i class="fas fa-star"></i>
                        </span>
                        <span v-else class="icon is-small has-text-warning">
                            <i class="far fa-star"></i>
                        </span>
                    </span>
                    <span v-on:click="setStars(3)">
                        <span v-if="stars >= 3" class="icon is-small has-text-warning">
                            <i class="fas fa-star"></i>
                        </span>
                        <span v-else class="icon is-small has-text-warning">
                            <i class="far fa-star"></i>
                        </span>
                    </span>
                    <span v-on:click="setStars(4)">
                        <span v-if="stars >= 4" class="icon is-small has-text-warning">
                            <i class="fas fa-star"></i>
                        </span>
                        <span v-else class="icon is-small has-text-warning">
                            <i class="far fa-star"></i>
                        </span>
                    </span>
                    <span v-on:click="setStars(5)">
                        <span v-if="stars >= 5" class="icon is-small has-text-warning">
                            <i class="fas fa-star"></i>
                        </span>
                        <span v-else class="icon is-small has-text-warning">
                            <i class="far fa-star"></i>
                        </span>
                    </span>
                </div>
            </div>
            <div class="field is-grouped is-grouped-centered">
                <p class="control">
                    <button v-on:click="postReview" class="button is-success is-medium is-focused">
                        <span class="icon is-small">
                            <i class="far fa-save"></i>
                        </span>
                        <span>Post review</span>
                    </button>
                </p>
            </div>
        </div>
        <Status v-bind:status="status"></Status>
    </div>
</template>

<script>
import Status from '../Status.vue'
import { 
    mapState
    } from 'vuex';

export default {
    name: "addReview",
    components: {
        Status
    },
    props: [
        'productID',
        'reviews'
    ], 
    data() {
        return {
            status: null,
            comment: '',
            stars: 0,
        }
    },
    computed: {
        ...mapState([
            'userLoggedIn'
        ]),
    },
    methods: {

        setStars(stars) {
            this.stars = stars;
        },
        
        /**
         * Call a Stitch function to record the new review, and pass the updated
         * product review statistics back up to the enclosing view/component tother
         * with the new review for rendering.
         */
        postReview () {
            this.$root.$data.stitchClient.callFunction("addReview", [
                this.productID,
                this.comment,
                this.stars
            ])
            .then ((results) => {
                if (results && results.averageReviewScore && results.numberOfReviews) {
                    let stats = {
                        averageReviewScore: results.averageReviewScore,
                        numberOfReviews: results.numberOfReviews
                    }
                    this.$emit('reviewStats', stats);
                    this.$emit('review', {review: this.comment, score: this.stars});
                }
            },
            (error) => {
                this.status = {state: 'error', text: `Error: failed to post review: ${error}`};
            })
        }
    }
}
</script>