# Wire up the chat screen
## Goal
We now have some Firebase code to read/ write chat messages for a channel, let's add a screen with Gifted Chat and wire it up.
## Tasks
1. Fix some ID stuff WRT ChatScreen
2. Wire up sending a message from ChannelsStore -> ChatScreen
3. Add support for streaming messages into ChannelsStore
4. Read messages onto ChatScreen
## Useful info

## How to do it
### 1. Use ID's when navigating from Channel -> Chat
1. Add a new view function to `ChannelStore`:
```
channelForId(id) {
  return store.channels.find(c => c.id === id);
},
```
Just for convenience. These don't cache, BTW.
2. Update onPress in `ChannelsScreen` to pass channel ID:
```
<ChannelItem
  key={item.id}
  channel={item}
  onPress={() => {
    navigation.navigate("Chat", { channelId: item.id })
  }}
/>
```
3. In `ChatScreen`, use the ID to get the title:
```
const channelId = route.params.channelId;

useHeader({
  title: channelStore.channelForId(channelId)?.name,
  leftIcon: "back",
  onLeftPress: navigation.goBack,
})
```

**TEST IT**: everything should work the same (should still see channel in the title of the screen)

### 2. Add a send function and use it to send messages, check them directly in Firebase
In a bigger app, I'd probably put messages in their own stores and page them out of a list by channel ID, but we're keeping things simple and putting everything in the `ChannelStore`.

1. Add `sendMessage` to the actions in `ChannelStore`:
```
const sendMessage = flow(function* sendMessage({ user, text, channelId }) {
  const db = getFirestore();
  const channelsCollection = collection(db, "channels");
  const channelDoc = doc(channelsCollection, channelId);
  const messagesCollection = collection(channelDoc, "messages");
  // add new document with auto-id
  yield addDoc(
    messagesCollection,
    {
      text,
      time: serverTimestamp(),
      username: user.email,
      uid: user.uid,
    }
  );
});
```

There's new imports, too:
```
import {
  collection,
  query,
  onSnapshot,
  getFirestore,
  addDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
```

2. Update parameters in `Chat` component inside of **ChatScreen.ts**:
```
function Chat({ onSendMessage, user, channelId }) {
```
3. Add `useStores` to `ChatScreen`, pass the relevant stuff to `Chat`:
```
const { channelStore, authenticationStore } = useStores()

// ...

<Chat
  user={authenticationStore.user}
  onSendMessage={channelStore.sendMessage}
  channelId={channelId}
/>
```
4. Wrap everything inside a callback inside `Chat` and pass that into GiftedChat:
```
const onSend = useCallback((messages = []) => {
  onSendMessage({user, text: messages[0].text, channelId })
}, [])

// ...

<GiftedChat
  messages={messages}
  onSend={onSend}
  renderMessage={renderMessage}
  user={{
    _id: 1,
  }}
/>
```

**TEST IT**: You should be able to send a message, not see anything in the UI, but it does show up in Firebase when you look at a channel in the console.

### 3. Stream messages and view them
1. Run `npx ignite-cli generate model Message` to create the `MessageModel`.
2. Setup the props as such:
```
  .props({
    id: types.identifier,
    uid: types.string,
    username: types.string,
    time: types.number,
    text: types.string,
  })
```
3. In `ChannelStore` add a prop for the messages:
```currentChannelMessages: types.array(MessageModel),```

Add a view for the messages:
```
get currentChannelMessagesForList() {
  return sortBy(store.currentChannelMessages.slice(), m => m.time);
}
```

And add an action in the first action block for updating them:
```
updateCurrentChannelMessages(querySnapshot) {
  store.currentChannelMessages.clear();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    store.currentChannelMessages.push({
      id: doc.id,
      uid: data.uid,
      username: data.username,
      // when message is added locally before upload, time is null because it will
      // later be set by the server
      time: data.time ? data.time.seconds * 1000 : new Date().getTime(),
      text: data.text,
    });
  });
}
```
4. Add actions for starting and stopping streaming. These will be used when entering the chat screen for a particular channel:
```
let unsubscribeFromChannelMessagesFeed; // we could later use this to tear down on logout... or something
const startStreamingMessagesForChannel = (channelId) => {
  const db = getFirestore();
  const channelsCollection = collection(db, "channels");
  const channelDoc = doc(channelsCollection, channelId);
  const messagesCollection = collection(channelDoc, "messages");
  const q = query(messagesCollection);
  unsubscribeFromChannelMessagesFeed = onSnapshot(q, (querySnapshot) => {
    store.updateCurrentChannelMessages(querySnapshot);
  });
};

const stopStreamingCurrentChannelMessages = () => {
  store.currentChannelMessages.clear();
  unsubscribeFromChannelMessagesFeed();
};
```
Be sure to return them with the other actions.
5. In `ChatScreen`, pass the messages to `Chat`:
```
let unsubscribeFromChannelMessagesFeed; // we could later use this to tear down on logout... or something
const startStreamingMessagesForChannel = (channelId) => {
  const db = getFirestore();
  const channelsCollection = collection(db, "channels");
  const channelDoc = doc(channelsCollection, channelId);
  const messagesCollection = collection(channelDoc, "messages");
  const q = query(messagesCollection);
  unsubscribeFromChannelMessagesFeed = onSnapshot(q, (querySnapshot) => {
    store.updateCurrentChannelMessages(querySnapshot);
  });
};

const stopStreamingCurrentChannelMessages = () => {
  store.currentChannelMessages.clear();
  unsubscribeFromChannelMessagesFeed();
};
```

And setup an effect to start and stop streaming at the top of `ChatScreen`:
```
useEffect(() => {
  channelStore.startStreamingMessagesForChannel(channelId);
  return () => {
    channelStore.stopStreamingCurrentChannelMessages();
  }
}, [])
```

6. Munge the messages in `Chat` into the Gifted Chat format:
```
const myMessages = useMemo(() => {
  return messages.reverse().map((message) => ({
    _id: message.id,
    text: message.text,
    createdAt: new Date(message.time),
    user: {
      _id: message.uid,
      name: message.username,
    },
  }))
}, [messages])
```
(you'll need to add a `messages` prop to `Chat` and pass that in from `ChatScreen`, too)
7. Update the props going into GiftedChat:
```
<GiftedChat
  messages={myMessages}
  onSend={onSend}
  renderMessage={renderMessage}
  user={{
    _id: user.uid,
  }}
/>
```

**TEST IT**: You should be able to send and see messages!

### TIP
If you get angry error messages about auth initialization, update App.js as such:
```
try  {
  initializeAuth(app,
    {
      persistence: reactNativeLocalPersistence
    }
  )
} catch (e) {}
```