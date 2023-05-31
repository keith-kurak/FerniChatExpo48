# Hello, Ignite! Goodbye, Ignite!
## Goal
Try out the ignite template and make some modifications to pare things down a bit.
## Tasks
1. Clone the project with the default ignite template
2. Delete some files we don't need because we're using Expo prebuild and some other default configs
3. Delete the screens we don't need
4. Rename our tabs that we'll use for the rest of the time
5. Make sure it all still works
## Useful info
### Node 18.x compatibility issue
If you get a weird SSL error when starting, do this:

macOS/ Linux:
`export NODE_OPTIONS=--openssl-legacy-provider`
Windows (Powershell):
`$env:NODE_OPTIONS="--openssl-legacy-provider"`

## How to do it
### 1. Run it as-is
Run `npx expo start` and pick a device/ emulator to run the app in Expo Go. Or press `w` to run the web version.

### 2. Delete some stuff we don't need.
We generally don't want to delete everything in the Ignite template we don't need, but we're going to remove a few things for good reasons:
- **ios/ android folders**: we're going to use Expo's prebuild to generate these on the fly, so we don't need them
- **metro.config.js**: the default is fine, and if you ever wanted to put this in a monorepo, I'd recommend the config in Expo's docs

### 3. Fix those dependencies
Not sure why they're off. But you can run `npx expo install --fix` to fix them.

### 4. Remove unnessary scripts
- Remove `postinstall` from **package.json** scripts. We're not managing native projects, so we don't need to install Cocoapods, etc.

### 5. Setup your navigation
We could rename everything, but don't worry too much about that.
What we're going to focus on is mangling this template to the point where it basically flows how our app is gonna flow. We'll fix all the names later. Now, if you want to fix the names, have at it!
#### a. Set your tabs
The four tabs you see after "logging in" are set by DemoNavigator. We're going to keep the PodcastList and Debug tabs, and use them for Channels and Settings.
1. Delete the other two tabs. You can just delete the entries in the TabNavigator itself for now (the orphaned files won't hurt anything).
2. Next, fix the icons and names. These are also set in DemoNavigator. There's a nice "community" and "settings" icon. Call the tabs "Channels" and "Settings".
#### a2. Let's fix the names
In DemoNavigator set DemoTabParamList to:
```
export type DemoTabParamList = {
  Channels: undefined
  Settings: undefined
}
```
Rename DemoPodcastListScreen to ChannelsScreen (rename file and the component name)
Rename DemoDebugScreen to SettingsScreen (rename file and the component name)
Make sure they're exporting correctly in screens/index.ts
Update their references in DemoNavigator
#### b. Set the structure of the Channels screen
We want a traditional, fixed navigation header with a list of "channels". We'll stub this all out with mock data in the ChannelsScreen.

1. Start by replacing `EpisodeCard` with a simple thing that displays the name of a channel:
```
const ChannelItem = observer(function ChannelItem({
  channel,
  onPress,
}: {
  channel: any
  onPress: () => void
}) {
  return <ListItem bottomSeparator onPress={onPress} text={`#${channel.name}`} />
})
```
Update your imports to include ListItem:
```
import { /** ... **/ ListItem } from "../components"
```

2. Replace everything in ChannelsScreen with this:

```
  const navigation =  useNavigation<NavigationProp<AppStackParamList>>()
  useHeader({
    title: 'Channels'
  })

   return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <FlatList<any>
        data={channels}
        contentContainerStyle={$flatListContentContainer}
        ListEmptyComponent={
          <EmptyState
            preset="generic"
            button={null}
            style={$emptyState}
            imageStyle={$emptyStateImage}
            ImageProps={{ resizeMode: "contain" }}
          />
        }
        renderItem={({ item }) => (
          <ChannelItem
            key={item.id}
            channel={item}
            onPress={() => {
              navigation.navigate("Chat", { channelId: item.name })
            }}
          />
        )}
      />
    </Screen>
  )
```

You'll need to add some imports:
```
import { useHeader } from 'app/utils/useHeader'
import { useNavigation, NavigationProp } from "@react-navigation/native"
import { AppStackParamList } from 'app/navigators'
```

Note some changes here:

Make a canned list of channels at the top of the file, like:
```
const channels = [
{
  id: "1",
  name: "llamas-who-code",
},
{
  id: "2",
  name: "pizza-toppings",
},
{
  id: "3",
  name: "taylor-swifts-favorite-cars",
}
]
```

Now you should have some simple channel titles, but tapping on them should crash.

There's going to be a ton of red squiggles in this file now. You can delete them if you'd like.

**What's going on with the header?**
We did a few mysterious things to change from a big inline header, to a fixed header at the top of the screen:
a. We added `useHeader()` to give us access to the screen's title. This is a helper for modifying some react navigation params
b. We set `safeAreaEdges` on Screen to an empty array, because `useHeader()` turns on React Navigation's header, which does its own safe area accounting.
c. There's still some extra space coming from `$flatListContentContainer` style. Try tweaking it to see what happens.

#### e. Add the stub for the chats screen
Even though we don't have chats, or real channels, we an still put a placeholder screen for the chat to show up when we tap on the channel.
1. Generate a new screen stub with `npx ignite-cli generate screen ChatScreen`
2. Add a new screen with parameter types in AppNavigator:
```
export type AppStackParamList = {
  Chat: { channelId: string },
  ...
}
```
3. Update ChatScreen to read the parameter for the title and add a back button
```
export const ChatScreen: FC<AppStackScreenProps<"Chat">> = observer(function ChatScreen() {
  const route = useRoute<AppStackScreenProps<"Chat">['route']>();
  const navigation = useNavigation();

  useHeader({
    title: route.params.channelId,
    leftIcon: "back",
    onLeftPress: navigation.goBack,
  })
  return (
    <Screen style={$root} preset="scroll">
      <Text text="chat" />
    </Screen>
  )
})
```

You'll need to add some imports, too:
```
import { useNavigation, useRoute } from "@react-navigation/native"
import { useHeader } from 'app/utils/useHeader'
```
4. Now you should be able to tap a channel and push a screen, and go back.

#### f. A little cleanup
In AppNavigator, change the logged in `initialRouteName` to `Demo`. Now, our navigation is basically 100% of what our final app will have. Login, logout, go to channels, it's all there

Also, those tab bars are ugly on web, fix in DemoNavigator with this `screenOptions` setting:
```
tabBarLabelPosition: "below-icon",
```


More TODO's:
- those side tabs on web, nasty (maybe fixed by metro)


### Bonus: Between Part 1 and 2
- Boring part: fix the names that don't really match what we're doing. If you want to sync with later lessons, these are the names we'll use:
  - ChannelsScreen
  - ChatScreen
  - LoginScreen
  - SettingsScreen
  - DemoNavigator -> MainNavigator
- Fun part: Add the "Add channel button" to ChannelsScreen