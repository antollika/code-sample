import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ActionPerformanceTile, {
  Props as ActionPerformanceTileProps,
  ActionPerformanceTileSkeleton,
} from '@core/components/molecules/ActionPerformanceTile'
import styled from '@emotion/styled'
import { ConversionEventByUrl, JourneyTrendName } from '@core/types'
import { Space } from '@core/components/styles/config'
import { useDispatch, useSelector } from 'react-redux'
import {
  licenseeIdSelector,
  publishedJourneysTrendsSelector,
} from '@core/redux/modules'
import ConversionActionPerformanceGraph from '@core/components/organisms/ConversionActionPerformanceGraph'
import { getPublishedJourneysTrends } from '@core/redux/modules/publishedJourneysTrends'
import { useRouter } from 'next/router'
import { getDateRangeFromUrl } from '@core/components/organisms/DashboardFilters/utils'
import {
  mapTrendsToTiles,
  setHiddenState,
  TILE_NAME_BY_TYPE,
  TILE_TYPES,
} from './utils'
import DashboardCardBodyWrapper from '@core/components/molecules/DashboardCardBodyWrapper'
import parseISO from 'date-fns/parseISO'
import { PixelMappingType } from '@core/redux/modules/pixelMappingList'

const Root = styled.div`
  position: relative;
`

const TilesWrapper = styled.div`
  display: flex;
  margin: ${Space.X3} ${Space.X2};

  > div:not(:last-child) {
    margin-right: ${Space.X6};
  }
`

const ActionPerformanceTileSkeletonList: React.FunctionComponent = () => {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <ActionPerformanceTileSkeleton key={i} />
      ))}
    </>
  )
}

const tileTypes = ['impressions', 'clicks', 'conversions']

const DashboardPerformanceGraph: React.FunctionComponent = () => {
  const dispatch = useDispatch()
  const {
    query: { advertiserId, journeyId, stageId, range = '' },
  } = useRouter()
  const { items, loading, loaded } = useSelector(
    publishedJourneysTrendsSelector,
  )
  const licenseeId = useSelector(licenseeIdSelector)
  const [tiles, setTiles] = useState<ActionPerformanceTileProps[]>([])

  const dateRange = useMemo(() => getDateRangeFromUrl(range as string), [range])

  const changeHiddenState = useCallback(
    ({ name = '' }: ConversionEventByUrl) => {
      setTiles(setHiddenState({ list: tiles, name }))
    },
    [tiles],
  )

  useEffect(() => {
    setTiles(mapTrendsToTiles(items))
  }, [items])

  useEffect(() => {
    if (licenseeId) {
      dispatch(
        getPublishedJourneysTrends({
          advertiserId,
          licenseeId,
          journeyId,
          journeyStagedId: stageId,
          range,
        }),
      )
    }
  }, [
    dispatch,
    dateRange.from,
    dateRange.to,
    journeyId,
    stageId,
    range,
    advertiserId,
    licenseeId,
  ])

  const eventsData = useMemo(() => {
    const events = ['Impressions', 'Clicks', 'Conversions']
    return {
      events: events.map(eventName => ({
        url: '',
        snippet: '',
        type: 'URL' as PixelMappingType,
        name: eventName as JourneyTrendName,
        count: 0,
        value: 0,
      })),
      isLoaded: true,
      isLoading: false,
    }
  }, [])

  const graphData = useMemo(() => {
    return {
      chartResults: items.metrics.map(metric => {
        return {
          events: TILE_TYPES.map(
            (type: 'views' | 'clicks' | 'conversions') => ({
              name: TILE_NAME_BY_TYPE[type] as JourneyTrendName,
              value: metric[type],
            }),
          ),
          timestamp: +parseISO(metric.date),
        }
      }),
      isLoaded: loaded,
      isLoading: loading,
    }
  }, [items, loaded, loading])

  return (
    <DashboardCardBodyWrapper isLoading={loading}>
      <Root>
        <TilesWrapper>
          {!loading && loaded ? (
            tiles.map(item => (
              <ActionPerformanceTile
                key={item.name}
                {...item}
                onClick={changeHiddenState}
              />
            ))
          ) : (
            <ActionPerformanceTileSkeletonList />
          )}
        </TilesWrapper>
        <ConversionActionPerformanceGraph
          tiles={tiles}
          dateRange={dateRange}
          graphHeight={300}
          crossHair={246}
          graphData={graphData}
          eventsData={eventsData}
          emptyStateText="There is no data to display."
          tileTypes={tileTypes}
        />
      </Root>
    </DashboardCardBodyWrapper>
  )
}

export default React.memo(DashboardPerformanceGraph)
