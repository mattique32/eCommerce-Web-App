<template>
<!-- Vue.js view. Rather than the user explicitly navigating to this 'page',
Stripe redirects their browser here once they've successfuly made the
payment. Before being directed here a Stitch webhook will aready have
received and acted on the payment confirmation. -->
  <div class="checked-out">
    <MyHeader></MyHeader>
    <section class="section">
      <div class="container">
        <h3 class="title is-3">Payment complete</h3>
      </div>
    </section>
    <div class="container">
      <Status v-bind:status="status"></Status>
    </div>
  </div>
</template>

<script>
import {
    mapMutations,
    mapActions
    } from 'vuex';
import MyHeader from '../components/Header.vue'
import Status from '../components/Status.vue'
import { setTimeout } from 'timers';

export default {
  name: 'checkedout',
  props: [
  ],
  components: {
    MyHeader,
    Status
  },
  data() {
    return {
      status: null
    }
  },
  methods: {
    ...mapMutations([
      'clearBasket'
    ]),
    ...mapActions([
        'fetchOrders',
        'calcBasketStats'
    ]),
    
    /**
     * Empty the shopping basket and fetch the updated list of orders (for this customer)
     * from the datanbase
     */
    updateBasketAndOrders () {
      this.clearBasket();
      this.calcBasketStats();
      this.fetchOrders(this.$root.$data.database)
      .then(() => {
        this.status = {state: 'progress', text: 'Taking you back to the store...'};
        let _this = this;
        setTimeout(function () {_this.$router.push({name: 'home'})}, 2000);
      },
      (error) => {
        this.status = {state: 'error', text: `Failed to fetch your orders from the database: ${error}`};
      });
    },

    /**
     * Hold off on rendering anything until we've authenticated with Stitch and have a client
     * connection to use
     */
    waitUntilStitchReady() {
      if (this.$root.$data.stitchClient && this.$root.$data.stitchClient.auth.isLoggedIn) {
        this.updateBasketAndOrders();
      } else {
        let _this = this;
        setTimeout(_this.waitUntilStitchReady, 100);
      }
    }
  },
  mounted() {
    this.waitUntilStitchReady();
  }
}
</script>