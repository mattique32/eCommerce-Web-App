<template>
<!-- Vue.js component to display the most recent reviews for a product. It embeds
the `ArchivedReviews` component which gives the user the option to access older
reviews (which are no longer held in the `customer` document). Provides a button
to allow a customer to add a new review for the product. -->
  <div class="container">
    <section class="section">
      <h3 class="title is-3">Reviews</h3>
      <a 
        v-if="!showReviewForm && !reviewSubmited"
        v-on:click="exposeReviewForm"
        v-on:reviewPosted="postedReview"
        class="button is-success"
      >
        <span class="icon">
            <i class="far fa-comment-dots"></i>
        </span>
        <span>Post Review</span>
      </a>
      <AddReview
        v-if="showReviewForm"
        v-bind:productID="productID"
        v-on:reviewStats="newReviewStats"
        v-on:review="newReview"
      ></AddReview>
      <br/><br/>
      <ul id="review-list">
        <li
          v-for="review in reviews.recentReviews"
          v-bind:key="review.review">
            <div class="box">
              {{ review.review }} <br/><br/>
                <div class="level-left">
                    <a v-for="rank in [1, 2, 3, 4, 5]" v-bind:key="rank" class="level-item">
                      <span v-if="review.score >= rank" class="icon is-small has-text-warning">
                        <i class="fas fa-star"></i>
                      </span>
                      <span v-else class="icon is-small has-text-warning">
                        <i class="far fa-star"></i>
                      </span>
                    </a>
                </div>
            </div>
        </li>
      </ul>
      <ArchivedReviews v-bind:productID="productID"></ArchivedReviews>
    </section>
  </div>
</template>

<script>
import AddReview from './addReview';
import ArchivedReviews from './archivedReviews';

export default {
  name: 'product-reviews',
  props: [
    'reviews',
    'productID'
],
  components: {
    AddReview,
    ArchivedReviews
  },
  data() {
    return {
      showReviewForm: false,
      reviewSubmited: false
    }
  },
  methods: {
    exposeReviewForm () {
      this.showReviewForm = true;
    },

    /**
     * Include the recently submitted review in the rendered list
     */
    postedReview (review) {
      this.reviews.unshift(review);
      this.reviewSubmited = true;
    },

    newReviewStats(stats) {
      this.$emit('reviewStats', stats);
    },

    /**
     * The customer has submitted a new review for this product and so this
     * component needs to reflect the effects of that review.
     */
    newReview(review) {
      this.reviews.recentReviews.unshift(review);
      this.showReviewForm = false;
      this.reviewSubmited = true;
    }
  },
}
</script>

<style scoped>
    .box {
        margin-bottom: .75em; 
    }
</style>
