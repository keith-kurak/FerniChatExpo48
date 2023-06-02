// Interested in migrating from FlatList to FlashList? Check out the recipe in our Ignite Cookbook
// https://ignitecookbook.com/docs/recipes/MigratingToFlashList
import { observer } from "mobx-react-lite"
import React, { FC, useState } from "react"
import {
  FlatList,
  ImageStyle,
  ViewStyle,
  View,
} from "react-native"
import Modal from "react-native-modal"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { EmptyState, Screen, ListItem, TextField, Button } from "../components"
import { isRTL } from "../i18n"
import { MainTabScreenProps } from "../navigators/MainNavigator"
import { spacing, colors } from "../theme"
import { useHeader } from 'app/utils/useHeader'
import { AppStackParamList } from 'app/navigators'
import { Channel, useStores } from 'app/models'

export const ChannelsScreen: FC<MainTabScreenProps<"Channels">> = observer(function ChannelsScreen(
  _props,
) {
  const navigation =  useNavigation<NavigationProp<AppStackParamList>>()

  const [isModalVisible, setModalVisible] = useState(false)

  const [newChannelName, setNewChannelName] = useState("")

  const { channelStore } = useStores()

  const toggleAddChannelModal = () => {
    setNewChannelName("")
    setModalVisible(!isModalVisible)
  }

  const addChannel = () => {
    if (!newChannelName) return;
    channelStore.addChannel(newChannelName)
    toggleAddChannelModal()
  }

  useHeader({
    title: 'Channels',
    rightText: "Add",
    onRightPress: toggleAddChannelModal,
  })

  return (
    <Screen preset="fixed" safeAreaEdges={[]} contentContainerStyle={$screenContentContainer}>
      <FlatList<Channel>
        data={channelStore.channelsForList}
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
              navigation.navigate("Chat", { channelId: item.id })
            }}
          />
        )}
      />
      <Modal isVisible={isModalVisible} onBackdropPress={toggleAddChannelModal}>
        <View style={{ backgroundColor: colors.background }}>
          <TextField
            autoFocus
            value={newChannelName}
            containerStyle={{ margin: spacing.small }}
            placeholder="Channel Name"
            onChangeText={(text) => setNewChannelName(text)}
          />
          <Button text="Add Channel" onPress={addChannel} />
        </View>
      </Modal>
    </Screen>
  )
})

const ChannelItem = observer(function ChannelItem({
  channel,
  onPress,
}: {
  channel: any
  onPress: () => void
}) {
  return <ListItem bottomSeparator onPress={onPress} text={`#${channel.name}`} />
})

// #region Styles
const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $flatListContentContainer: ViewStyle = {
  paddingHorizontal: spacing.large,
  // paddingTop: spacing.large + spacing.extraLarge,
  paddingBottom: spacing.large,
}

const $emptyState: ViewStyle = {
  marginTop: spacing.huge,
}

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
// #endregion

// @demo remove-file
