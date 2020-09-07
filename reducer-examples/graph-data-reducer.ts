import { steps } from 'redux-effects-steps'
import { fetchrRead } from 'redux-effects-fetchr'
import { createAsyncActionTypes } from '@core/redux/util'
import { PublishedJourneysTrends } from '@core/types'
import { format } from 'date-fns'
import { getDateRangeFromUrl } from '@core/components/organisms/DashboardFilters/utils'

const GET_PUBLISHED_JOURNEYS_TRENDS = `core/published/journeys/trends/get`

// Action Types
export const [
  GET_PUBLISHED_JOURNEYS_TRENDS_REQUEST,
  GET_PUBLISHED_JOURNEYS_TRENDS_SUCCESS,
  GET_PUBLISHED_JOURNEYS_TRENDS_FAIL,
] = createAsyncActionTypes(GET_PUBLISHED_JOURNEYS_TRENDS)

type GetPublishedJourneysSuccessPayload = {
  data: PublishedJourneysTrends
}

type GetPublishedJourneysTrendsRequest = {
  type: typeof GET_PUBLISHED_JOURNEYS_TRENDS_REQUEST
  payload: {}
}
type GetPublishedJourneysTrendsSuccess = {
  type: typeof GET_PUBLISHED_JOURNEYS_TRENDS_SUCCESS
  payload: GetPublishedJourneysSuccessPayload
}
type GetPublishedJourneysTrendsFail = {
  type: typeof GET_PUBLISHED_JOURNEYS_TRENDS_FAIL
  payload: Error
  error: boolean
}

type RequestParam = number | string | string[]

type GetPublishedJourneysRequestPayload = {
  advertiserId?: RequestParam
  licenseeId?: RequestParam
  journeyId?: RequestParam
  journeyStagedId?: RequestParam
  range: string | string[]
}

// Action Creators
function getPublishedJourneysTrendsRequest(
  payload: GetPublishedJourneysRequestPayload,
): GetPublishedJourneysTrendsRequest {
  return {
    type: GET_PUBLISHED_JOURNEYS_TRENDS_REQUEST,
    payload,
  }
}

function getPublishedJourneysTrendsSuccess(payload: {
  data: PublishedJourneysTrends
}): GetPublishedJourneysTrendsSuccess {
  return {
    type: GET_PUBLISHED_JOURNEYS_TRENDS_SUCCESS,
    payload,
  }
}

function getPublishedJourneysTrendsFail(
  error: Error,
): GetPublishedJourneysTrendsFail {
  return {
    type: GET_PUBLISHED_JOURNEYS_TRENDS_FAIL,
    payload: error,
    error: true,
  }
}

export function getPublishedJourneysTrends(
  payload: GetPublishedJourneysRequestPayload,
) {
  const { from, to } = getDateRangeFromUrl(payload.range as string)
  const query = {
    advertiserIds: payload.advertiserId,
    licenseeIds: payload.licenseeId,
    journeyIds: payload.journeyId,
    journeyStagedIds: payload.journeyStagedId,
    start: format(from, 'yyyy-MM-dd'),
    end: format(to, 'yyyy-MM-dd'),
  }
  return steps(
    getPublishedJourneysTrendsRequest(payload),
    fetchrRead('published/journeys/trends', query),
    [getPublishedJourneysTrendsSuccess, getPublishedJourneysTrendsFail],
  )
}

export type ListItem = {
  id: number
  name: string
}

export type State = {
  loaded: boolean
  loading: boolean
  items: PublishedJourneysTrends
}

const INITIAL_STATE: State = {
  loaded: false,
  loading: false,
  items: {
    clicks: 0,
    conversions: 0,
    cpa: 0,
    cpc: 0,
    cpm: 0,
    ctr: 0,
    views: 0,
    metrics: [],
  },
}

// Reducer
type Action =
  | GetPublishedJourneysTrendsRequest
  | GetPublishedJourneysTrendsSuccess
  | GetPublishedJourneysTrendsFail

function getPublishedJourneysSuccessReducer(
  state: State,
  action: GetPublishedJourneysTrendsSuccess,
) {
  const {
    payload: { data: items },
  } = action

  return {
    loaded: true,
    loading: false,
    items,
  }
}

export default function publishedJourneysTrendsReducer(
  state: State = INITIAL_STATE,
  action: Action,
): State {
  switch (action.type) {
    case GET_PUBLISHED_JOURNEYS_TRENDS_REQUEST: {
      return {
        ...state,
        loaded: false,
        loading: true,
      }
    }
    case GET_PUBLISHED_JOURNEYS_TRENDS_SUCCESS: {
      return getPublishedJourneysSuccessReducer(
        state,
        action as GetPublishedJourneysTrendsSuccess,
      )
    }
    case GET_PUBLISHED_JOURNEYS_TRENDS_FAIL: {
      return {
        ...state,
        loaded: true,
        loading: false,
      }
    }
    default: {
      return state
    }
  }
}
