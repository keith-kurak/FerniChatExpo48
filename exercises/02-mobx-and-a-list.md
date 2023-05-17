# Hello, MobX and a list of stuff from MobX!
## Goal
Initialize your MobX state tree model with a canned list of channels and display it on the channels tab. Watch the list update as you add channels.
## Tasks
1.
## Useful info

## Since you've been gone
We've cleaned up some filenames, deleted the screens that we don't need anymore, and added a button and dialog for adding a channel to the list, but it doesn't do anything yet.
Let's make it add data locally by wiring reading and writing of data to an MST store.
## How to do it
### 1. Add some stores
1. Run npx ignite-cli generate model Channel
2. Run npx ignite-cli generate model ChannelStore
3. Add props for your channel:
```
.props({
  id: types.identifierNumber,
  name: types.string,
})
```
4. Add channels to the ChannelStore
```
.props({
    channels: types.array(ChannelModel),
  })
```
(don't forget to add the right import)
5. Add an `addChannel` function to the ChannelStore
```
.actions((self) => ({
  addChannel(name: string) {
    self.channels.push({ name, id: self.channels.length })
  }
}))
```
### 2. Wire the list to MST
1. Reference the stores (accept automatic import updates)
```
const { channelStore } = useStores()
```
2. Update the data in the FlatList to use the store:
```
data={channelStore.channels}
```
You'll notice that the list is empty now
3. Add a function to add a channel to the store and close the modal
```
 const addChannel = () => {
    channelStore.addChannel(newChannelName)
    toggleAddChannelModal()
  }
```
4. Update the modal to call that function when add is pressed
```
<Button text="Add Channel" onPress={addChannel} />
```
