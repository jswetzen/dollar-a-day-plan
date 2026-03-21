import PocketBase from 'pocketbase'

const pb = new PocketBase(
  import.meta.env.DEV ? 'http://localhost:8090' : window.location.origin
)

export default pb
