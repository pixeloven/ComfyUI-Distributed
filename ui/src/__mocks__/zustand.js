// Mock implementation of zustand for testing
const zustand = {
  create: (typeOrInitializer) => {
    // Handle curried syntax: create<Type>()
    if (typeof typeOrInitializer === 'undefined') {
      return (storeInitializer) => {
        const mockSet = () => {}
        const mockGet = () => ({})
        const mockApi = {}

        if (typeof storeInitializer === 'function') {
          const initialState = storeInitializer(mockSet, mockGet, mockApi)
          return () => initialState
        }
        return () => ({})
      }
    }

    // Handle direct syntax: create(storeInitializer)
    if (typeof typeOrInitializer === 'function') {
      const mockSet = () => {}
      const mockGet = () => ({})
      const mockApi = {}

      const initialState = typeOrInitializer(mockSet, mockGet, mockApi)
      return () => initialState
    }

    return () => ({})
  }
}

module.exports = zustand