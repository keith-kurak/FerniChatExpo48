import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    user: types.frozen(),
    loginError: types.maybe(types.string),
    isLoading: false,
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.user
    },
  }))
  .actions((store) => {
    const login = flow(function* login({ email, password }) {
      const auth = getAuth()
      try {
        store.isLoading = true
        store.loginError = undefined
        yield signInWithEmailAndPassword(auth, email, password)
      } catch (error) {
        store.loginError = error.message
      } finally {
        store.isLoading = false
      }
    })

    const logout = flow(function* logout() {
      const auth = getAuth()
      try {
        yield signOut(auth)
        store.user = undefined
        store.loginError = undefined
      } catch (error) {
        // eh?
      }
    })

    const setUser = (user) => {
      store.user = user
    }

    return {
      logout,
      login,
      setUser,
    }
  })
  .actions((store) => {
    function afterCreate() {
      const auth = getAuth()
      onAuthStateChanged(auth, (user) => {
        if (user) {
          store.setUser(user)
        } else {
          store.setUser(undefined)
        }
      })
    }

    return {
      afterCreate,
    }
  })

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}

// @demo remove-file
