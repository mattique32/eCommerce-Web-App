import Vue from 'vue'
import App from './App.vue'
import Vuex from 'vuex';
import router from './router'
import 'bulma/css/bulma.css'
import './main.scss'
import createPersistedState from 'vuex-persistedstate'

Vue.config.productionTip = false

const nullCustomer =  {
  name: {
    title: '',
    first: '',
    last: '',
  },
  contact: {
    email: '',
    phone: {
      home: '',
      work: '',
      mobile: ''
    },
    deliveryAddress: {
      number: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  },
  marketingPreferences: {
    email: false,
    sms: false
  },
  waitingOnProducts: [],
  shoppingBasket: [],
  orders: [],
  orderOverflow: false
};

const nullMetaCustomer = {
  shoppingBasketSize: 0,
  shoppingBasketValue: 0
}

const store = new Vuex.Store({
  plugins: [createPersistedState()],
  state: {
    userLoggedIn: false,
    userFirstName: "Guest",
    customer: nullCustomer,
    metaCustomer: nullMetaCustomer,
    categoryFilter: [],
    checkoutID: ''
  },

  mutations: {
    // Any changes to state held in `store` should be done through these
    // mutations. No asynchronous calls should be made from a mutation
    // (that should be performed within an action which in turn
    // invokes the relevant mutation(s))
    
    setLoggedIn (state, payload) {state.userLoggedIn = payload},

    setUserFirstName (state, payload) {state.userFirstName = payload},
    
    setCategoryFilter (state, payload) {state.categoryFilter = payload},
    
    setCustomer (state, payload) {state.customer = payload},
    
    setEmail (state, payload) {Vue.set(state.customer.contact, 'email', payload)},
    
    setWaitingOnProducts (state, payload) {
      const newList = payload.slice();
      Vue.set(state.customer, 'waitingOnProducts', newList);
    },
    
    setShoppingBasket (state, payload) {Vue.set(state.customer, 'shoppingBasket', payload)},
    
    setShoppingBasketSize (state, payload) {Vue.set(state.metaCustomer, 'shoppingBasketSize', payload);},
    
    setShoppingBasketValue (state, payload) {Vue.set(state.metaCustomer, 'shoppingBasketValue', payload)},
    
    pushBasketItem (state, payload) {state.customer.shoppingBasket.push(payload)},
    
    increaseBasketItemQuantity (state, payload) {
      Vue.set(
        state.customer.shoppingBasket[payload.index], 
        'quantity',
        state.customer.shoppingBasket[payload.index].quantity + payload.quantity)
    },
    
    setBasketItemQuantity (state, payload) {
      state.customer.shoppingBasket[payload.index].quantity =  payload.quantity;
    },
    
    clearBasket (state) {
      Vue.set(state.customer, 'shoppingBasket', []);
      Vue.set(state.metaCustomer, 'shoppingBasketSize', 0);
      Vue.set(state.metaCustomer, 'shoppingBasketValue', 0);
    },
    
    signout (state) {
      Vue.set(state, 'customer', nullCustomer);
      Vue.set(state.customer, 'contact', {});
      state.metaCustomer.shoppingBasketSize = 0;
      state.metaCustomer.shoppingBasketValue = 0;
      state.userLoggedIn = false;
      state.userFirstName = 'Guest';
      state.categoryFilter = [];
    },
    
    setOrders (state, payload) {
      Vue.set(state.customer, 'orders', payload.orders);
      Vue.set(state.customer, 'orderOverflow', payload.orderOverflow);
    }
  },

  actions: {
    // Actions should be used when the store state needs to be updated together
    // with other (asynchronous) tasks.

    addToBasket ({commit, state, dispatch}, payload) {
      // payload = {database, itemArray}
      if (payload.itemArray && payload.itemArray.length > 0) {
        payload.itemArray.forEach((item, incomingIndex) => {
          const existingIndex = state.customer.shoppingBasket.findIndex((entry) => {
            return entry.productID === item.productID;
          });
          if (existingIndex < 0) {
            // No matching productID in existing basket
            commit('pushBasketItem', payload.itemArray[incomingIndex]);
          } else {
            commit('increaseBasketItemQuantity', {
              index: incomingIndex,
              quantity: payload.itemArray[incomingIndex].quantity});
          }
        });
        if (state.userLoggedIn) {
          // If not already logged in then the basket will be written to the database
          // when the customer logs in
          if (payload.database) {
            const customers = payload.database.collection('customers');
            customers.updateOne(
              {"contact.email": state.customer.contact.email},
              {$set: {shoppingBasket: state.customer.shoppingBasket}}
            )
            .catch ((error) => {
              /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
              console.error(`Failed to update the shopping basket in the database: ${error.message}`);
            });
          }
        }        
      }
      dispatch('calcBasketStats');
    },

    deleteFromBasket ({commit, state, dispatch}, payload) {
      // `payload` = {database, productID}
      if (payload.productID) {
        const existingIndex = state.customer.shoppingBasket.findIndex((entry) => {
          return entry.productID === payload.productID;
        });
        if (existingIndex >= 0) {
          let newBasket = state.customer.shoppingBasket.slice();
          newBasket.splice(existingIndex, 1);
          commit('setShoppingBasket', newBasket);
          dispatch('calcBasketStats');
          if (state.userLoggedIn) {
            // If not already logged in then the basket will be written to the database
            // when the customer logs in
            if (payload.database) {
              const customers = payload.database.collection('customers');
              customers.updateOne(
                {"contact.email": state.customer.contact.email},
                {$set: {shoppingBasket: newBasket}}
              )
              .catch ((error) => {
                /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
                console.error(`Failed to update the shopping basket in the database: ${error.message}`);
              });
            }
          }
        }
      }
    },

    updateBasketItemQuantity ({commit, state, dispatch}, payload) {
      // `payload` = {database, productID, quantity} 
      if (payload) {
        const existingIndex = state.customer.shoppingBasket.findIndex((entry) => {
          return entry.productID === payload.productID;
        });
        if (existingIndex >= 0) {
          commit('setBasketItemQuantity', {index: existingIndex, quantity: payload.quantity});
          dispatch('calcBasketStats');
          if (state.userLoggedIn) {
            // If not already logged in then the basket will be written to the database
            // when the customer logs in
            if (payload.database) {
              const customers = payload.database.collection('customers');
              customers.updateOne(
                {"contact.email": state.customer.contact.email},
                {$set: {shoppingBasket: state.customer.shoppingBasket}}
              )
              .catch ((error) => {
                /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
                console.error(`Failed to update the shopping basket in the database: ${error.message}`);
              });
            }
          }
        }
      }
    },

    emptyBasket ({state, commit}, database) {
      commit('clearBasket');
      if (state.userLoggedIn) {
        // If not already logged in then the basket will be written to the database
        // when the customer logs in
        if (database) {
          const customers = database.collection('customers');
          customers.updateOne(
            {"contact.email": state.customer.contact.email},
            {$set: {shoppingBasket: state.customer.shoppingBasket}}
          )
          .catch ((error) => {
            /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
            console.error(`Failed to update the shopping basket in the database: ${error.message}`);
          });
        }
      }
    },

    calcBasketStats ({commit, state}) {
      const shoppingBasketSize = state.customer.shoppingBasket.reduce((total, item) =>
        {
          return total + item.quantity;
        }, 0);
        commit('setShoppingBasketSize', shoppingBasketSize);
      const shoppingBasketValue = state.customer.shoppingBasket.reduce((total, item) =>
        {
          return total + (item.quantity * item.price);
        }, 0);
      commit('setShoppingBasketValue', shoppingBasketValue);
    },

    setUserLoggedIn ({commit, state, dispatch}, payload) {
      // payload = {database, user} 
      commit('setLoggedIn', true);
      commit('setEmail', payload.user.profile.email);
      if (payload.user.profile.firstName) {
        commit('setUserFirstName', payload.user.profile.firstName);
      } else if (payload.user.profile.email) {
        commit('setUserFirstName', payload.user.profile.email);  
      }
      return new Promise ((resolve, reject) => {
        try {
          payload.database.collection("customers")
          .findOne({"contact.email": payload.user.profile.data.email}) 
          .then (customerDoc => {
            if (customerDoc) {
              console.log(`logging in; ${state.customer.shoppingBasket.length} items in temp basket`);
                let localBasket = [];
                state.customer.shoppingBasket.forEach((item) => {localBasket.push(item)});
                commit('setCustomer', customerDoc);
                // Avoid losing contents of local basket (created before customer logged in)
                dispatch('addToBasket', {
                  database: payload.database,
                  itemArray: localBasket});
              commit('setUserFirstName', customerDoc.name.first);
            }
              resolve();
          }, (error) => {
            let errorMessage = `Error: attempt to read customer document failed: ${error}`;
              /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */   
              console.error(errorMessage);
              reject (errorMessage);
          }) 
        }
        catch (error) {
          let errorMessage = `Error: Call to fetch customer document failed: ${error.message}`;
          /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */   
          console.error(errorMessage);
          reject(errorMessage);
        }
      })
    },

    refreshCustomer ({commit, state}, database) {
      if (state.customer.contact.email) {
        return database.collection('customers').findOne(
          {"contact.email": state.customer.contact.email})
        .then ((customer) => {
          commit('setCustomer', customer);
        },
        (error) => {
          /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
          console.error(`Error, failed to fetch the customer document: ${error}`);
        })
      }
    },

    fetchOrders ({commit, state}, database) {
      const customers = database.collection('customers');
      return customers.findOne(
        {"contact.email": state.customer.contact.email},
        {$projection: {
          orders: 1,
          orderOverflow: 1
        }}
      )
      .then ((doc) => {
        commit('setOrders', doc);
      });
    },

    deleteOrder ({commit, state}, payload) {
      // `payload` = {database, orderID} 
      if (payload.orderID) {
        const existingIndex = state.customer.orders.findIndex((entry) => {
          return entry.orderID === payload.orderID;
        });
        if (existingIndex >= 0) {
          let newOrders = state.customer.orders.slice();
          newOrders.splice(existingIndex, 1);
          commit('setOrders', {orders: newOrders, orderOverflow: state.customer.orderOverflow});
          if (state.userLoggedIn) {
            // If not already logged in then the basket will be written to the database
            // when the customer logs in
            if (payload.database) {
              const customers = payload.database.collection('customers');
              customers.updateOne(
                {"contact.email": state.customer.contact.email},
                {$set: {orders: newOrders}}
              )
              .catch ((error) => {
                /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
                console.error(`Failed to update the order list in the database: ${error.message}`);
              });
            }
          }
        }
      }
    },

    unWatch ({commit, state}, payload) {
      // 
      // `payload` = {database, productID}
      if (payload.productID) {
        const existingIndex = state.customer.waitingOnProducts.findIndex((entry) => {
          return entry === payload.productID;
        });
        if (existingIndex >= 0) {
          let newList = state.customer.waitingOnProducts.slice();
          newList.splice(existingIndex, 1);
          commit('setWaitingOnProducts', newList);
          if (state.userLoggedIn) {
            // If not already logged in then the list will be written to the database
            // when the customer logs in
            if (payload.database) {
              const customers = payload.database.collection('customers');
              customers.updateOne(
                {"contact.email": state.customer.contact.email},
                {$set: {waitingOnProducts: newList}}
              )
              .catch ((error) => {
                /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
                console.error(`Failed to update the order list in the database: ${error.message}`);
              });
            }
          }
        }
      }
    }
  }
});

new Vue({
  router,
  store,
  data: {
    stitchClient: null, // Structure is too complex to store in `state`
    database: null // Structure is too complex to store in `state`
  },
  computed: {
  },
  render: h => h(App)
}).$mount('#app')
