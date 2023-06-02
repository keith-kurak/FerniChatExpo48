import React, { FC, useMemo, useCallback, useEffect } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle } from "react-native"
import { AppStackScreenProps } from "app/navigators"
import { Screen, SlackMessage } from "app/components"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useHeader } from "app/utils/useHeader"
import { GiftedChat } from "react-native-gifted-chat"
import { useStores } from "app/models"

export const ChatScreen: FC<AppStackScreenProps<"Chat">> = observer(function ChatScreen() {
  const route = useRoute<AppStackScreenProps<"Chat">["route"]>()
  const navigation = useNavigation()
  const { channelStore, authenticationStore } = useStores()

  const channelId = route.params.channelId

  useEffect(() => {
    channelStore.startStreamingMessagesForChannel(channelId);
    return () => {
      channelStore.stopStreamingCurrentChannelMessages();
    }
  }, [])

  useHeader({
    title: channelStore.channelForId(channelId)?.name,
    leftIcon: "back",
    onLeftPress: navigation.goBack,
  })

  return (
    <Screen contentContainerStyle={$root} preset="fixed" safeAreaEdges={["bottom"]}>
      <Chat
        user={authenticationStore.user}
        onSendMessage={channelStore.sendMessage}
        messages={channelStore.currentChannelMessagesForList}
        channelId={channelId}
      />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

function Chat({ messages, onSendMessage, user, channelId }) {
  const renderMessage = useCallback((props) => <SlackMessage {...props} />, [])

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

  const onSend = useCallback((messages = []) => {
    onSendMessage({user, text: messages[0].text, channelId })
  }, [])

  return (
    <GiftedChat
      messages={myMessages}
      onSend={onSend}
      renderMessage={renderMessage}
      user={{
        _id: user.uid,
      }}
    />
  )
}
