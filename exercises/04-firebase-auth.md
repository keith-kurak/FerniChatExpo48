# Authenticate with Firebase!
## Goal
Make the login screen actually work, using Firebase email/ password authentication. We're going to ignore sign-up workflow for now. Suffice to say, it would basically involve collecting an initial email and password on a diffent screen.
## Tasks
1. Set up email/ password auth in Firebase
2. Create an account inside the console for testing
3. Wire-up `AuthenticationStore` to Firebase
4. Add basic "must be authenticated" security to the security rules (turn off test mode).
## Useful info

## How to do it
### 1. Setup email/password auth
1. In Firebase console, go to Build -> Authentication
2. Select email/ password login method
3. UNSELECT "email link" (I actually love this method and think we all should use it long-term, but it's out of scope for today)
4. Save

### 2. Create a test user
1. Inside the Authentication dashboard still, go to Users.
2. Create a new user that you will use to test.
TIP: Use gmail aliases, e.g., youremail+fernchat@gmail.com. Then you can create multiple accounts.

### 3. Wire up AuthenticationStore
We're going to modify `AuthenticationStore` significantly. It's just easier this way.
1. New imports:
```
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth"
```
2. New props and views:
```
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
```
The "frozen" type is just kind of like `any` - it could be whatever. We could figure out the exact type of the Firebase object, or we could store a subset of it, but maybe another day.

3. New first actions block:
```
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
  ```
  `setUser` is there so we can set the user safely in a callback in the next action block. Notice that `login` doesn't actually set the user, that's because there's a Firebase listener that will automatically update as auth state changes.
  4. Second action block to setup a listener for auth state change:
  ```
  .actions((store) => {
    function afterCreate() {
      const auth = getAuth()
      onAuthStateChanged(auth, (user) => {
        if (user) {
          store.setUser(user)
        } else {
          store.logout()
        }
      })
    }

    return {
      afterCreate,
    }
  })
  ```
### 4. Wire up login screen
1. Since the old `AuthenticationStore.setAuthEmail` is gone, we need to clean up local state to support all form fields, like this:
```
const [authEmail, setAuthEmail] = useState("")
const [authPassword, setAuthPassword] = useState("")
const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
```

2. Get rid of the first `useEffect()` so it doesn't default in an email and password. Also, get rid of the second `useEffect()` hook!
3. Pull in your stores functionality:
```
const {
    authenticationStore: { login, loginError, isLoading },
  } = useStores()
```
4. Make a new `onPressLogin` callback that sends the email and password to the store's login method:
```
const onPressLogin = useCallback(() => {
    login({ email: authEmail, password: authPassword })
  }, [authEmail, authPassword])
```
Set the events that used `login` to use `onPressLogin` instead.
5. Replace `error` references with `loginError`. This won't make the prettiest error messages, but it will do for now.

### OMG why isn't the auth state persisting?
Hooboy, Firebase team really throws you for a loop. It turns out that the default auth persistence provider is in-memory, so you get logged out whenever you reload! You can override it to a local storage provider... which doesn't work with React Native 71 :-/

So, jam this code into App.js, right after the Firebase init. Probably good to refactor this into a different file if you're doing the real thing.

```
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const reactNativeLocalPersistence =
  getReactNativePersistence({
    getItem(...args) {
      // Called inline to avoid deprecation warnings on startup.
      return AsyncStorage.getItem(...args);
    },
    setItem(...args) {
      // Called inline to avoid deprecation warnings on startup.
      return AsyncStorage.setItem(...args);
    },
    removeItem(...args) {
      // Called inline to avoid deprecation warnings on startup.
      return AsyncStorage.removeItem(...args);
    },
  });

initializeAuth(app,
  {
    persistence: reactNativeLocalPersistence
  }
)
```

New imports:
```
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from "firebase/auth"
```

**TEST IT** You should be able to login now.

### 5. Add security rules
Update your security rules in Firebase (Firestore -> Rules) as such:
```
rules_version = '2'
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
    }
  }
}
```