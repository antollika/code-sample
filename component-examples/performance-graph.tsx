import React, { useCallback, useMemo, useState } from 'react'
import { Props as ActionPerformanceTileProps } from '@core/components/molecules/ActionPerformanceTile'
import styled from '@emotion/styled'
import { ConversionEventByUrl, ThemeType } from '@core/types'
import { FontSize, Space } from '@core/components/styles/config'
import {
  conversionEventColors,
  TILE_TYPES,
} from '@core/components/organisms/ConversionActionPerformance/utils'
import {
  FlexibleXYPlot,
  LineSeries,
  XAxis,
  YAxis,
  HorizontalGridLines,
  MarkSeries,
  Crosshair,
} from 'react-vis'
import { differenceInCalendarDays, format } from 'date-fns'
import startOfDay from 'date-fns/startOfDay'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'
import { withTheme } from 'emotion-theming'
import { DateRange } from '@core/components/organisms/ConversionActionPerformance'
import {
  getMaxValue,
  JSXStyles,
} from '@core/components/organisms/ConversionActionPerformanceGraph/utils'
import { css, Global } from '@emotion/core'
import Spinner from '@core/components/atoms/Spinner'
import CrosshairInfoBox from '@core/components/molecules/CrosshairInfoBox'
import { ConversionEventsTimestampDTO } from '@core/redux/modules/pixelGraph'
import { nFormatter } from '@core/components/utils/formatNumber'

type Props = {
  theme: ThemeType
  dateRange: DateRange
  tiles: ActionPerformanceTileProps[]
  graphData: {
    chartResults: ConversionEventsTimestampDTO[]
    isLoading: boolean
    isLoaded: boolean
  }
  eventsData: {
    events: ConversionEventByUrl[]
    isLoading: boolean
    isLoaded: boolean
  }
  graphHeight?: number
  crossHair?: number
  emptyStateText?: string
  tileTypes?: string[]
}

export type CrosshairValue = ConversionEventByUrl & {
  x: number
  y: number
  color: string
}

type Coordinate = { x: number; y: number }

type LineSeriesData = {
  Lead: Coordinate[]
  Purchase: Coordinate[]
  Contact: Coordinate[]
  Signup: Coordinate[]
  Impressions: Coordinate[]
  Clicks: Coordinate[]
  Conversions: Coordinate[]
}

const GlobalStyles = (theme: ThemeType) => css`
  .crosshair-container {
    position: absolute;
  }
`

const Root = styled.div`
  display: grid;
  grid-template-columns: 2rem 100%;
  margin: ${Space.X3} ${Space.X2};
`

const GraphWrapper = styled.div`
  position: relative;
`

const EmptyStateWrapper = styled.div`
  left: 40%;
  position: absolute;
  top: 40%;
`

const CountText = styled.div`
  align-self: center;
  color: ${({ theme }) => theme.colors.toolbox};
  font-size: ${FontSize.XXS};
  height: 2rem;
  margin-top: -${Space.X6};
  transform: rotate(-90deg);
`

const Center = styled.div`
  display: flex;
  justify-content: center;
  position: absolute;
  top: 37.5%;
  width: 100%;
`
const flexibleXYPlotMargin = {
  left: 50,
  right: 40,
  top: 14,
  bottom: 40,
}

const getDateRange = (dateRange: DateRange) => {
  return {
    from: startOfDay(dateRange.from),
    to: startOfDay(dateRange.to),
  }
}

const yAxisFormat = (value: number) => nFormatter(value, 0)

const ConversionActionPerformanceGraph: React.FunctionComponent<Props> = ({
  theme,
  tiles,
  dateRange: dateRangeFromProps,
  graphHeight = 200,
  crossHair = 146,
  graphData,
  eventsData,
  emptyStateText = 'There are no conversions to display.',
  tileTypes = TILE_TYPES,
}) => {
  const dateRange = useMemo(() => getDateRange(dateRangeFromProps), [
    dateRangeFromProps,
  ])
  const [crosshairState, setCrosshairState] = useState<{
    x: number
    y: number
    innerX: number
    crosshairValues: CrosshairValue[]
  }>({
    x: 0,
    y: 0,
    innerX: 0,
    crosshairValues: [],
  })

  const [infoBoxCoordinates, setInfoBoxCoordinates] = useState<{
    boxX: number
    boxY: number
  }>({
    boxX: 0,
    boxY: 0,
  })

  const {
    chartResults,
    isLoading: isPixelGraphDataLoading,
    isLoaded: isPixelGraphDataLoaded,
  } = graphData

  const {
    events: conversionEvents,
    isLoading: isConversionEventsLoading,
    isLoaded: isConversionEventsLoaded,
  } = eventsData

  const emptyData = useMemo<Coordinate[]>(() => {
    return chartResults.length
      ? chartResults.map(({ timestamp: x }) => ({
          x: +startOfDay(x),
          y: 0,
        }))
      : [
          {
            x: +dateRange.from,
            y: 0,
          },
          {
            x: +dateRange.to,
            y: 0,
          },
        ]
  }, [chartResults, dateRange.from, dateRange.to])

  const maxValue = useMemo<number>(() => {
    return getMaxValue(chartResults, conversionEvents)
  }, [chartResults, conversionEvents])

  const yDomainMaxValue = Math.floor(maxValue * 1.1) + 1
  const xDomain: number[] = [+dateRange.from, +dateRange.to]
  const yDomain: number[] = [0, yDomainMaxValue]

  const daysInRange = differenceInCalendarDays(dateRange.to, dateRange.from)
  const recalculatedDaysInRange = daysInRange <= 1 ? 2 : daysInRange

  const xAxisTickValues = useMemo(() => {
    const tickTotal = recalculatedDaysInRange <= 4 ? recalculatedDaysInRange : 4
    return Array.from({ length: tickTotal }, (value, index) => {
      if (!index) {
        return +dateRange.from
      }
      const lastIndex = tickTotal - 1
      if (index === lastIndex) {
        return +dateRange.to
      }
      return +startOfDay(
        +dateRange.from +
          (+dateRange.to - +dateRange.from) / (lastIndex / index),
      )
    })
  }, [dateRange.from, dateRange.to, recalculatedDaysInRange])

  const isDataLoaded = useMemo(() => {
    return (
      !isPixelGraphDataLoading &&
      isPixelGraphDataLoaded &&
      !isConversionEventsLoading &&
      isConversionEventsLoaded
    )
  }, [
    isConversionEventsLoaded,
    isConversionEventsLoading,
    isPixelGraphDataLoaded,
    isPixelGraphDataLoading,
  ])

  const isGraphDataToShow = useMemo(
    () =>
      isDataLoaded &&
      chartResults.length &&
      tiles.some(({ isHidden }) => !isHidden),
    [chartResults.length, tiles, isDataLoaded],
  )

  const needShowEmptyStateText = useMemo(
    () =>
      isDataLoaded &&
      (!chartResults.length || !tiles.some(({ isHidden }) => !isHidden)),
    [chartResults.length, tiles, isDataLoaded],
  )

  const yAxisTickValues = [
    0,
    yDomainMaxValue * (1 / 3),
    yDomainMaxValue * (2 / 3),
    yDomainMaxValue,
  ]

  const lineSeriesData: LineSeriesData = useMemo(() => {
    const data: LineSeriesData = {
      Lead: [],
      Purchase: [],
      Contact: [],
      Signup: [],
      Impressions: [],
      Clicks: [],
      Conversions: [],
    }
    chartResults.forEach(({ events, timestamp }) => {
      events.forEach(event => {
        if (!event.name) return
        const coordinates = data[event.name].concat({
          x: timestamp,
          y: event.value,
        })
        data[event.name] = sortBy(coordinates, ['x'])
      })
    })
    return data
  }, [chartResults])

  const crosshairMappedData: {
    [key: number]: ConversionEventByUrl[]
  } = useMemo(() => {
    return chartResults.reduce((crosshairData, { timestamp, events }) => {
      return {
        ...crosshairData,
        [timestamp]: events.filter(
          event =>
            event.name &&
            tiles.find(tile => tile.name === event.name && !tile.isHidden),
        ),
      }
    }, {})
  }, [chartResults, tiles])

  const colorRange = useMemo<string[]>(
    () => conversionEventColors.map(color => theme.colors[color]),
    [theme.colors],
  )

  const onNearestX = useCallback(
    (
      { x, y }: Coordinate,
      { innerX, event }: { innerX: number; index: number; event: MouseEvent },
    ) => {
      const newInfoBoxCoordinates = {
        boxX: event.offsetX,
        boxY: event.offsetY,
      }
      if (crosshairState.innerX === innerX) return
      const singleCrosshairMappedData = crosshairMappedData[x] || []
      const sortedCrosshairValues = tileTypes.reduce(
        (sortedTiles: ConversionEventByUrl[], type) => {
          const tile = singleCrosshairMappedData.find(
            ({ name = '' }) => name.toLowerCase() === type,
          )
          return tile ? sortedTiles.concat([tile]) : sortedTiles
        },
        [],
      )
      const crosshairValues = sortedCrosshairValues.map(conversionEvent => {
        const correspondingTile = tiles.find(
          tile => tile.name === conversionEvent.name,
        )
        const color =
          theme.colors[get(correspondingTile, 'color', 'primaryText')]
        return {
          x,
          y: conversionEvent.value,
          color,
          ...conversionEvent,
        }
      })
      setCrosshairState({
        x,
        y,
        innerX,
        crosshairValues,
      })
      setInfoBoxCoordinates(newInfoBoxCoordinates)
    },
    [
      crosshairState.innerX,
      crosshairMappedData,
      tileTypes,
      tiles,
      theme.colors,
    ],
  )

  const onMouseLeave = useCallback(() => {
    setCrosshairState({
      x: 0,
      y: 0,
      innerX: 0,
      crosshairValues: [],
    })
    setInfoBoxCoordinates({
      boxX: 0,
      boxY: 0,
    })
  }, [])

  const crossHairStyle = useMemo(
    () => JSXStyles.crosshair({ height: crossHair }),
    [crossHair],
  )

  return (
    <Root>
      <CountText>{isDataLoaded && 'Count'}</CountText>
      <GraphWrapper>
        <FlexibleXYPlot
          xType="time"
          margin={flexibleXYPlotMargin}
          colorRange={colorRange}
          colorType="category"
          xDomain={xDomain}
          yDomain={yDomain}
          height={graphHeight}
          onMouseLeave={onMouseLeave}>
          <HorizontalGridLines
            tickTotal={4}
            tickValues={yAxisTickValues}
            style={JSXStyles.horizontalGridLines}
          />
          <YAxis
            style={JSXStyles.yAxis}
            tickFormat={yAxisFormat}
            {...(isGraphDataToShow
              ? { tickValues: yAxisTickValues }
              : {
                  tickTotal: 0,
                })}
          />
          <XAxis
            tickValues={xAxisTickValues}
            style={JSXStyles.xAxis}
            tickFormat={(value: number) => format(value, 'MMM dd')}
          />
          <LineSeries
            onNearestX={onNearestX}
            data={emptyData}
            style={JSXStyles.emptyLineSeries}
          />
          {!isPixelGraphDataLoading &&
            tiles.map(({ name = '', isHidden, color }, index) => {
              return (
                (!isHidden &&
                  name &&
                  (lineSeriesData[name].length > 1 ? (
                    <LineSeries
                      key={name}
                      color={theme.colors[color]}
                      data={lineSeriesData[name]}
                      style={JSXStyles.lineSeries}
                    />
                  ) : (
                    <MarkSeries
                      key={name}
                      data={lineSeriesData[name]}
                      colorType="literal"
                      color={theme.colors[color]}
                      style={JSXStyles.markSeries(theme.colors[color])}
                    />
                  ))) ||
                null
              )
            })}
          <MarkSeries
            colorType="literal"
            size={4}
            data={crosshairState.crosshairValues}
          />
          <Crosshair
            values={crosshairState.crosshairValues}
            className="crosshair-container"
            style={crossHairStyle}>
            <CrosshairInfoBox
              x={crosshairState.x}
              y={crosshairState.y}
              boxX={infoBoxCoordinates.boxX}
              boxY={infoBoxCoordinates.boxY}
              innerX={crosshairState.innerX}
              crosshairValues={crosshairState.crosshairValues}
            />
          </Crosshair>
        </FlexibleXYPlot>
        {(isPixelGraphDataLoading || isConversionEventsLoading) && (
          <Center>
            <Spinner />
          </Center>
        )}
        {needShowEmptyStateText && (
          <EmptyStateWrapper>{emptyStateText}</EmptyStateWrapper>
        )}
      </GraphWrapper>
      <Global styles={GlobalStyles(theme)} />
    </Root>
  )
}

export default withTheme(ConversionActionPerformanceGraph)
