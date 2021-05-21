import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { useLayout } from '@/utils/hooks'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'

const LrcLine = memo(({ text, line, activeLine }) => {
  const theme = useGetter('common', 'theme')

  return (
    <Text style={{ ...styles.line, color: activeLine == line ? theme.secondary : theme.normal10 }}>{text}</Text>
  )
}, (prevProps, nextProps) => {
  return prevProps.text == nextProps.text &&
  prevProps.line == nextProps.line &&
  prevProps.activeLine != nextProps.line &&
  nextProps.activeLine != nextProps.line
})
const wait = new Promise(resolve => setTimeout(resolve, 500))

export default memo(() => {
  const lyricLines = useLrcSet()
  const { line } = useLrcPlay()
  const scrollViewRef = useRef()
  const isPauseScrollRef = useRef(true)
  const scrollTimoutRef = useRef(null)
  const lineRef = useRef(0)
  const linesRef = useRef([])
  const isFirstSetLrc = useRef(true)
  // const playMusicInfo = useGetter('player', 'playMusicInfo')
  // const [imgUrl, setImgUrl] = useState(null)
  // const theme = useGetter('common', 'theme')
  // const { onLayout, ...layout } = useLayout()

  // useEffect(() => {
  //   const url = playMusicInfo ? playMusicInfo.musicInfo.img : null
  //   if (imgUrl == url) return
  //   setImgUrl(url)
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [playMusicInfo])

  // const imgWidth = useMemo(() => layout.width * 0.75, [layout.width])
  const handleScrollToActive = useCallback((index = lineRef.current) => {
    if (!scrollViewRef.current || !linesRef.current.length) return
    scrollViewRef.current.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.4,
    })
  }, [])

  const handleScrollBeginDrag = () => {
    isPauseScrollRef.current = true
    if (scrollTimoutRef.current) clearTimeout(scrollTimoutRef.current)
    scrollTimoutRef.current = setTimeout(() => {
      scrollTimoutRef.current = null
      isPauseScrollRef.current = false
      handleScrollToActive()
    }, 3000)
  }

  const handleScrollToIndexFailed = (info) => {
    console.log(info)
    wait.then(() => {
      scrollTimoutRef.current?.scrollToIndex({ index: info.index, animated: true })
    })
  }

  useEffect(() => {
    setTimeout(() => {
      isPauseScrollRef.current = false
      handleScrollToActive()
    }, 500)
    return () => {
      if (scrollTimoutRef.current) {
        clearTimeout(scrollTimoutRef.current)
        scrollTimoutRef.current = null
      }
    }
  }, [handleScrollToActive])

  useEffect(() => {
    linesRef.current = lyricLines
    if (!scrollViewRef.current || !lyricLines.length) return
    scrollViewRef.current.scrollToOffset({
      offset: 0,
      animated: false,
    })
    if (isFirstSetLrc.current) {
      isFirstSetLrc.current = false
    } else {
      setTimeout(() => {
        handleScrollToActive(0)
      }, 100)
    }
  }, [handleScrollToActive, lyricLines])

  useEffect(() => {
    lineRef.current = line
    if (!scrollViewRef.current || !linesRef.current.length || isPauseScrollRef.current) return
    handleScrollToActive()
  }, [handleScrollToActive, line])


  const handleRenderItem = ({ item, index }) => {
    return (
      <LrcLine text={item.text} line={index} activeLine={line} />
    )
  }

  const spaceComponent = useMemo(() => (
    <View style={styles.space}></View>
  ), [])

  return (
    <FlatList
      data={lyricLines}
      renderItem={handleRenderItem}
      keyExtractor={(item, index) => index}
      style={styles.container}
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={spaceComponent}
      ListFooterComponent={spaceComponent}
      onScrollBeginDrag={handleScrollBeginDrag}
      fadingEdgeLength={200}
      initialNumToRender={Math.max(line + 10, 10)}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  space: {
    paddingTop: '80%',
  },
  line: {
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 28,
    // opacity: 0,
  },
})