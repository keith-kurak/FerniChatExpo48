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
} from "firebase/firestore";

/**
 * Model description here for TypeScript hints.
 */
export const ChannelStoreModel = types
  .model("ChannelStore")
  .props({
    channels: types.array(ChannelModel),
  })
  .views((store) => ({
    get channelsForList() {
      return sortBy(store.channels.slice(), c => c.name.toLowerCase());
    },
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

    return {
      afterCreate,
      beforeDestroy,
      addChannel,
    }
  })

export interface ChannelStore extends Instance<typeof ChannelStoreModel> {}
export interface ChannelStoreSnapshotOut extends SnapshotOut<typeof ChannelStoreModel> {}
export interface ChannelStoreSnapshotIn extends SnapshotIn<typeof ChannelStoreModel> {}
export const createChannelStoreDefaultModel = () => types.optional(ChannelStoreModel, {})
