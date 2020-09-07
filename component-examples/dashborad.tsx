import React from 'react'
import styled from '@emotion/styled'
import { Space } from '@core/components/styles/config'
import DashboardCard from '@core/components/molecules/DashboardCard'
import DashboardFilters from '../DashboardFilters'
import {
  JOURNEY_AREA,
  ADVERTISER_AREA,
  STAGE_AREA,
  NEW_JOURNEY_BUTTON_AREA,
  TOP_LEVEL_AREA,
  SECOND_LEVEL_AREA,
  GRAPH_AREA,
  DATE_AREA,
  GRID_GAP,
  CELL_WIDTH,
} from '@core/components/organisms/Dashboard/utils'
import DashboardTopLevelCards from '../DashboardTopLevelCards'
import DashboardStageLevelCards from '../DashboardStageLevelCards'
import DashboardPerformanceGraph from '../DashboardPerformanceGraph'

const Root = styled.div`
  background: ${props => props.theme.colors.surface};
  display: flex;
  justify-content: center;
  min-width: 1024px;
  padding: ${Space.X8} 0;
  position: relative;
`

const smallResolutionArea = `
  '${ADVERTISER_AREA} ${JOURNEY_AREA} ${STAGE_AREA}'
    '${DATE_AREA} ${NEW_JOURNEY_BUTTON_AREA} ${NEW_JOURNEY_BUTTON_AREA}'
    '${TOP_LEVEL_AREA}'
    '${SECOND_LEVEL_AREA}'
    '${GRAPH_AREA} ${GRAPH_AREA} ${GRAPH_AREA}'
`

const Main = styled.div`
  display: grid;
  grid-gap: ${GRID_GAP};
  grid-template-areas: ${smallResolutionArea};
  grid-template-columns: ${CELL_WIDTH} ${CELL_WIDTH} ${CELL_WIDTH};
  grid-template-rows: 2.5rem 2.5rem 12.5rem 12.5rem 29rem;
`

const NotificationWrapper = styled.div`
  display: none;
`

const Dashboard = () => {
  return (
    <Root>
      <Main>
        <DashboardFilters />
        <DashboardTopLevelCards />
        <DashboardStageLevelCards />
        <DashboardCard title="Key Performance" gridArea={GRAPH_AREA}>
          <DashboardPerformanceGraph />
        </DashboardCard>
        <NotificationWrapper>
          <DashboardCard title="Notifications" headerIcon="05-bell" />
        </NotificationWrapper>
      </Main>
    </Root>
  )
}

export default Dashboard
