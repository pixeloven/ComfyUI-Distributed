// Mock implementation of zustand/middleware for testing
const middleware = {
  subscribeWithSelector: (storeInitializer) => {
    return (set, get, api) => {
      if (typeof storeInitializer === 'function') {
        return storeInitializer(set, get, api)
      }
      return {}
    }
  }
}

module.exports = middleware