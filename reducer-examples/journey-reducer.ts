import { steps } from 'redux-effects-steps'
import { fetchrRead, fetchrCreate } from 'redux-effects-fetchr'
import { createAsyncActionTypes } from '@core/redux/util'
import { Journey, Nullable, TableSort } from '@core/types'
import uniqBy from 'lodash.uniqby'
import {
  UPDATE_JOURNEY_STATUS_SUCCESS,
  UpdateJourneyStatusSuccess,
} from './journey'

const JOURNEYS = 'core/journeys'
const GET_JOURNEYS = `${JOURNEYS}/get`
const GET_LOAD_MORE_JOURNEYS = `${JOURNEYS}/loadMore/get`
const COPY_JOURNEY = `${JOURNEYS}/copy`

// Action Types
export const [
  GET_JOURNEYS_REQUEST,
  GET_JOURNEYS_SUCCESS,
  GET_JOURNEYS_FAIL,
] = createAsyncActionTypes(GET_JOURNEYS)

// Action Types
export const [
  GET_LOAD_MORE_JOURNEYS_REQUEST,
  GET_LOAD_MORE_JOURNEYS_SUCCESS,
  GET_LOAD_MORE_JOURNEYS_FAIL,
] = createAsyncActionTypes(GET_LOAD_MORE_JOURNEYS)

export const [
  COPY_JOURNEY_REQUEST,
  COPY_JOURNEY_SUCCESS,
  COPY_JOURNEY_FAIL,
] = createAsyncActionTypes(COPY_JOURNEY)

type GetJourneysParams = {
  advertiserId?: Nullable<number> | string | string[]
  licenseeId?: number
  offset?: number
  pageSize?: number
  q?: string
  sort?: TableSort
  statuses?: string[]
}

type GetJourneysRequest = {
  type: typeof GET_JOURNEYS_REQUEST
  payload: GetJourneysParams
}
type GetJourneysSuccess = {
  type: typeof GET_JOURNEYS_SUCCESS
  payload: { data: Journey[] }
}
type GetJourneysFail = {
  type: typeof GET_JOURNEYS_FAIL
  payload: Error
  error: boolean
}

type GetLoadMoreJourneysRequest = {
  type: typeof GET_LOAD_MORE_JOURNEYS_REQUEST
  payload: GetJourneysParams
}
type GetLoadMoreJourneysSuccess = {
  type: typeof GET_LOAD_MORE_JOURNEYS_SUCCESS
  payload: { data: Journey[] }
}
type GetLoadMoreJourneysFail = {
  type: typeof GET_LOAD_MORE_JOURNEYS_FAIL
  payload: Error
  error: boolean
}

type CopyJourneyRequest = {
  type: typeof COPY_JOURNEY_REQUEST
  payload: JourneyCopyParams
}
type CopyJourneySuccess = {
  type: typeof COPY_JOURNEY_SUCCESS
  payload: { data: Journey }
}
type CopyJourneyFail = {
  type: typeof COPY_JOURNEY_FAIL
  payload: Error
  error: boolean
}

// Action Creators
function getJourneysRequest(payload: GetJourneysParams): GetJourneysRequest {
  return {
    type: GET_JOURNEYS_REQUEST,
    payload,
  }
}

function getJourneysSuccess(payload: { data: Journey[] }): GetJourneysSuccess {
  return {
    type: GET_JOURNEYS_SUCCESS,
    payload,
  }
}

function getJourneysFail(error: Error): GetJourneysFail {
  return {
    type: GET_JOURNEYS_FAIL,
    payload: error,
    error: true,
  }
}

function getLoadMoreJourneysRequest(
  payload: GetJourneysParams,
): GetLoadMoreJourneysRequest {
  return {
    type: GET_LOAD_MORE_JOURNEYS_REQUEST,
    payload,
  }
}

function getLoadMoreJourneysSuccess(payload: {
  data: Journey[]
}): GetLoadMoreJourneysSuccess {
  return {
    type: GET_LOAD_MORE_JOURNEYS_SUCCESS,
    payload,
  }
}

function getLoadMoreJourneysFail(error: Error): GetLoadMoreJourneysFail {
  return {
    type: GET_LOAD_MORE_JOURNEYS_FAIL,
    payload: error,
    error: true,
  }
}

function copyJourneyRequest(payload: JourneyCopyParams): CopyJourneyRequest {
  return {
    type: COPY_JOURNEY_REQUEST,
    payload,
  }
}

function copyJourneySuccess(payload): CopyJourneySuccess {
  return {
    type: COPY_JOURNEY_SUCCESS,
    payload,
  }
}

function copyJourneyFail(error: Error): CopyJourneyFail {
  return {
    type: COPY_JOURNEY_FAIL,
    payload: error,
    error: true,
  }
}

function makePayload(payload: GetJourneysParams) {
  const { sort, ...rest } = payload
  if (sort?.sortBy) {
    return {
      ...rest,
      sortType: sort.sortBy,
      desc: sort.sortDirection === 'DESC',
    }
  }
  return rest
}

export function getJourneys(payload: GetJourneysParams) {
  return steps(
    getJourneysRequest(payload),
    fetchrRead('journeys', makePayload(payload)),
    [getJourneysSuccess, getJourneysFail],
  )
}

export function getLoadMoreJourneys(payload: GetJourneysParams) {
  return steps(
    getLoadMoreJourneysRequest(payload),
    fetchrRead('journeys', makePayload(payload)),
    [getLoadMoreJourneysSuccess, getLoadMoreJourneysFail],
  )
}

type JourneyCopyParams = {
  params: {
    journeyId: number
  }
  body: {
    name: string
  }
}

export function copyJourney(journeyId: number, name: string) {
  return steps(
    copyJourneyRequest({
      params: { journeyId },
      body: { name },
    }),
    fetchrCreate('journeys/copy', { journeyId }, { name }),
    [copyJourneySuccess, copyJourneyFail],
  )
}

export type State = {
  loaded: boolean
  loading: boolean
  cloning: boolean
  recentlyCloned: boolean
  items: Journey[]
}

const INITIAL_STATE: State = {
  loaded: false,
  loading: false,
  cloning: false,
  recentlyCloned: false,
  items: [],
}

// Reducer
type Action =
  | GetJourneysRequest
  | GetJourneysSuccess
  | GetJourneysFail
  | GetLoadMoreJourneysRequest
  | GetLoadMoreJourneysSuccess
  | GetLoadMoreJourneysFail
  | CopyJourneyRequest
  | CopyJourneySuccess
  | CopyJourneyFail

function getJourneysSuccessReducer(state: State, action: GetJourneysSuccess) {
  const {
    payload: { data: journeys },
  } = action

  return {
    ...state,
    loaded: true,
    loading: false,
    items: journeys,
    recentlyCloned: false,
  }
}

function getLoadMoreJourneysSuccessReducer(
  state: State,
  action: GetJourneysSuccess,
) {
  const {
    payload: { data: journeys },
  } = action

  return {
    ...state,
    loaded: true,
    loading: false,
    items: uniqBy([...state.items, ...journeys], 'id'),
    recentlyCloned: false,
  }
}

function copyJourneySuccessReducer(state: State, action: CopyJourneySuccess) {
  const {
    payload: { data: journey },
  } = action

  return {
    ...state,
    cloning: false,
    recentlyCloned: true,
    items: [journey, ...state.items],
  }
}

export default function journeyReducer(
  state: State = INITIAL_STATE,
  action: Action,
): State {
  switch (action.type) {
    case GET_JOURNEYS_REQUEST: {
      return {
        ...state,
        loaded: false,
        loading: true,
        recentlyCloned: false,
      }
    }
    case GET_JOURNEYS_SUCCESS: {
      return getJourneysSuccessReducer(state, action as GetJourneysSuccess)
    }
    case GET_JOURNEYS_FAIL: {
      return {
        ...state,
        loaded: true,
        loading: false,
        recentlyCloned: false,
      }
    }
    case GET_LOAD_MORE_JOURNEYS_REQUEST: {
      return {
        ...state,
        loaded: false,
        loading: true,
        recentlyCloned: false,
      }
    }
    case GET_LOAD_MORE_JOURNEYS_SUCCESS: {
      return getLoadMoreJourneysSuccessReducer(
        state,
        action as GetJourneysSuccess,
      )
    }
    case GET_LOAD_MORE_JOURNEYS_FAIL: {
      return {
        ...state,
        loaded: true,
        loading: false,
        recentlyCloned: false,
      }
    }
    case COPY_JOURNEY_REQUEST: {
      return {
        ...state,
        cloning: true,
        recentlyCloned: false,
      }
    }
    case COPY_JOURNEY_SUCCESS: {
      return copyJourneySuccessReducer(state, action as CopyJourneySuccess)
    }
    case COPY_JOURNEY_FAIL: {
      return {
        ...state,
        cloning: false,
        recentlyCloned: false,
      }
    }
    default: {
      return state
    }
  }
}
