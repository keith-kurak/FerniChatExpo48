// Interested in migrating from FlatList to FlashList? Check out the recipe in our Ignite Cookbook
// https://ignitecookbook.com/docs/recipes/MigratingToFlashList
import { observer } from "mobx-react-lite"
import React, { FC, useEffect, useMemo } from "react"
import {
  AccessibilityProps,
  ActivityIndicator,
  FlatList,
  Image,
  ImageStyle,
  Platform,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { Button, Card, EmptyState, Icon, Screen, Text, Toggle, ListItem } from "../components"
import { isRTL, translate } from "../i18n"
import { useStores } from "../models"
import { Episode } from "../models/Episode"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import { colors, spacing } from "../theme"
import { delay } from "../utils/delay"
import { openLinkInBrowser } from "../utils/openLinkInBrowser"
import { useHeader } from 'app/utils/useHeader'
import { AppStackParamList } from 'app/navigators'

const ICON_SIZE = 14

const rnrImage1 = require("../../assets/images/rnr-image-1.png")
const rnrImage2 = require("../../assets/images/rnr-image-2.png")
const rnrImage3 = require("../../assets/images/rnr-image-3.png")
const rnrImages = [rnrImage1, rnrImage2, rnrImage3]

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

export const ChannelsScreen: FC<DemoTabScreenProps<"Channels">> = observer(function ChannelsScreen(
  _props,
) {
  const navigation =  useNavigation<NavigationProp<AppStackParamList>>()
  useHeader({
    title: 'Channels'
  })
  return (
    <Screen preset="fixed" safeAreaEdges={[]} contentContainerStyle={$screenContentContainer}>
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

const $heading: ViewStyle = {
  marginBottom: spacing.medium,
}

const $item: ViewStyle = {
  padding: spacing.medium,
  marginTop: spacing.medium,
  minHeight: 120,
}

const $itemThumbnail: ImageStyle = {
  marginTop: spacing.small,
  borderRadius: 50,
  alignSelf: "flex-start",
}

const $toggle: ViewStyle = {
  marginTop: spacing.medium,
}

const $labelStyle: TextStyle = {
  textAlign: "left",
}

const $iconContainer: ViewStyle = {
  height: ICON_SIZE,
  width: ICON_SIZE,
  flexDirection: "row",
  marginEnd: spacing.small,
}

const $metadata: TextStyle = {
  color: colors.textDim,
  marginTop: spacing.extraSmall,
  flexDirection: "row",
}

const $metadataText: TextStyle = {
  color: colors.textDim,
  marginEnd: spacing.medium,
  marginBottom: spacing.extraSmall,
}

const $favoriteButton: ViewStyle = {
  borderRadius: 17,
  marginTop: spacing.medium,
  justifyContent: "flex-start",
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.palette.neutral300,
  paddingHorizontal: spacing.medium,
  paddingTop: spacing.micro,
  paddingBottom: 0,
  minHeight: 32,
  alignSelf: "flex-start",
}

const $unFavoriteButton: ViewStyle = {
  borderColor: colors.palette.primary100,
  backgroundColor: colors.palette.primary100,
}

const $emptyState: ViewStyle = {
  marginTop: spacing.huge,
}

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
// #endregion

// @demo remove-file
