import { Instance, SnapshotIn, SnapshotOut, types, flow } from "mobx-state-tree"
import { sortBy } from 'lodash';
import { withSetPropAction } from "./helpers/withSetPropAction"
import { ChannelModel } from 'app/models/Channel'
import {
  collection,
  query,
  onSnapshot,
  getFirestore,
  addDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { MessageModel } from 'app/models/Message';

/**
 * Model description here for TypeScript hints.
 */
export const ChannelStoreModel = types
  .model("ChannelStore")
  .props({
    channels: types.array(ChannelModel),
    currentChannelMessages: types.array(MessageModel),
  })
  .views((store) => ({
    get channelsForList() {
      return sortBy(store.channels.slice(), c => c.name.toLowerCase());
    },
    channelForId(id) {
      return store.channels.find(c => c.id === id);
    },
    get currentChannelMessagesForList() {
      return sortBy(store.currentChannelMessages.slice(), m => m.time);
    }
  }))
  .actions(withSetPropAction)
  // this allows TS to register updateChannels as an action for use in the next block
  // see https://mobx-state-tree.js.org/tips/typescript#typing-self-in-actions-and-views
  .actions((store) => ({
    updateChannels(querySnapshot) {
      store.channels.clear();
      querySnapshot.forEach((doc) => {
        store.channels.push({ id: doc.id, name: doc.data().name });
      });
    },
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
  }))
  .actions((store) => {
    let unsubscribeFromFirebaseStream;
    function afterCreate() {
      const db = getFirestore();
      const q = query(collection(db, "channels"));
      unsubscribeFromFirebaseStream = onSnapshot(q, (querySnapshot) => {
        store.updateChannels(querySnapshot);
      });
    }

    function beforeDestroy() {
      unsubscribeFromFirebaseStream && unsubscribeFromFirebaseStream();
    }

    const addChannel = flow(function* addChannel(name) {
      const db = getFirestore();
      // add new document with auto-id
      yield addDoc(collection(db, "channels"), {
        name
      });
    });

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

    return {
      afterCreate,
      beforeDestroy,
      addChannel,
      sendMessage,
      startStreamingMessagesForChannel,
      stopStreamingCurrentChannelMessages,
    }
  })

export interface ChannelStore extends Instance<typeof ChannelStoreModel> {}
export interface ChannelStoreSnapshotOut extends SnapshotOut<typeof ChannelStoreModel> {}
export interface ChannelStoreSnapshotIn extends SnapshotIn<typeof ChannelStoreModel> {}
export const createChannelStoreDefaultModel = () => types.optional(ChannelStoreModel, {})
