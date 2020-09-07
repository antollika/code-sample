import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Form } from 'react-final-form'
import SearchingSelect, {
  SelectOption,
} from '@core/components/molecules/SearchingSelect'
import { useDispatch, useSelector } from 'react-redux'
import {
  advertiserDropdownSelector,
  publishedJourneyStagesDropdownSelector,
  journeysSelector,
  authSelector,
} from '@core/redux/modules'
import { getAdvertiserDropdown } from '@core/redux/modules/advertiserDropdown'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import {
  getInitialValueFromList,
  mapListToOptions,
  getUrlDateRangeString,
  getDateRangeFromUrl,
  dashboardDateRangePresets,
} from './utils'
import { getPublishedJourneyStagesDropdown } from '@core/redux/modules/publishedJourneyStagesDropdown'
import omit from 'lodash/omit'
import DateRangePresetsPicker from '@core/components/molecules/DateRangePresetsPicker'
import { DateRange } from '@core/components/organisms/ConversionActionPerformance'
import {
  BorderRadius,
  Space,
  lineHeight,
  FontSize,
} from '@core/components/styles/config'
import { onClickEvent } from '@core/types'
import { Icon } from '@ui/core'
import Button from '@core/components/atoms/Button'
import strings from '@core/i18n'
import {
  DATE_AREA,
  NEW_JOURNEY_BUTTON_AREA,
  STAGE_AREA,
  ADVERTISER_AREA,
  JOURNEY_AREA,
} from '../Dashboard/utils'
import { getJourneys } from '@core/redux/modules/journeys'

export type FilterQueryParams = {
  advertiserId?: string
  journeyId?: string
  stageId?: string
  range?: string
}

const FilterItem = styled.div<{ gridArea: string }>`
  grid-area: ${({ gridArea }) => gridArea};
`

const DateRangeFilterWrapper = styled.div`
  align-items: center;
  display: flex;
  grid-area: ${DATE_AREA};
  justify-content: space-between;
`

const DateRangeLabel = styled.div`
  color: ${props => props.theme.colors.secondaryText};
  font-size: ${FontSize.XS};
`

const ALL_ADVERTISERS_VALUE = {
  label: 'All Advertisers',
  value: 0,
}

const ALL_JOURNEYS_VALUE = {
  label: 'All Journeys',
  value: 0,
}

const ALL_STAGES_VALUE = {
  label: 'All Stages',
  value: 0,
}

const DateRangeWrapper = styled.div`
  align-items: center;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${BorderRadius.Default};
  color: ${props => props.theme.colors.secondaryText};
  cursor: pointer;
  display: flex;
  font-size: ${FontSize.S};
  height: ${Space.X10};
  line-height: ${lineHeight.normal};
  padding: ${Space.X2} ${Space.X3};
  position: relative;
  text-align: center;
  user-select: none;

  > i {
    margin-right: ${Space.X2};
  }
`

const DateRangeTrigger = React.memo(function Component(
  props: PropsWithChildren<{ onClick: onClickEvent }>,
) {
  return (
    <DateRangeWrapper onClick={props.onClick}>
      <Icon name="calendar" size="s" />
      {props.children}
    </DateRangeWrapper>
  )
})

const DashboardFilters = () => {
  const {
    licensee,
    userProfile: {
      permissions: { journey: journeyPermission },
    },
  } = useSelector(authSelector)
  const advertiserDropdown = useSelector(advertiserDropdownSelector)
  const journeysList = useSelector(journeysSelector)
  const publishedJourneyStagesDropdown = useSelector(
    publishedJourneyStagesDropdownSelector,
  )
  const { query, replace, push } = useRouter()
  const { advertiserId, journeyId, stageId, range } = query as FilterQueryParams

  const dispatch = useDispatch()
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromUrl(range),
  )

  const [licenseeId, setLicenseeId] = useState(0)
  useEffect(() => {
    if (licensee.id && +licensee.id !== +licenseeId) {
      setLicenseeId(licensee.id)
      replace({
        pathname: '/dashboard',
      })
    }
  }, [licensee.id, licenseeId, replace])

  useEffect(() => {
    if (licenseeId) {
      dispatch(getAdvertiserDropdown({ licenseeIds: licenseeId.toString() }))
    }
  }, [dispatch, licenseeId])

  useEffect(() => {
    const queryParams = {
      advertiserId,
      licenseeId,
      statuses: ['CANCELLED', 'PAUSED', 'COMPLETED', 'PUBLISHED'],
    }
    if (licenseeId) {
      dispatch(getJourneys(queryParams))
    }
  }, [dispatch, advertiserId, licenseeId])

  useEffect(() => {
    if (licenseeId) {
      dispatch(
        getPublishedJourneyStagesDropdown({
          advertiserId,
          licenseeId,
          journeyId,
        }),
      )
    }
  }, [dispatch, advertiserId, journeyId, licenseeId])

  const advertiserOptions = useMemo(
    () => [
      ALL_ADVERTISERS_VALUE,
      ...mapListToOptions(advertiserDropdown.items),
    ],
    [advertiserDropdown.items],
  )

  const journeysOptions = useMemo(
    () => [ALL_JOURNEYS_VALUE, ...mapListToOptions(journeysList.items)],
    [journeysList.items],
  )

  const publishedJourneyStagesOptions = useMemo(
    () => [
      ALL_STAGES_VALUE,
      ...mapListToOptions(publishedJourneyStagesDropdown.items),
    ],
    [publishedJourneyStagesDropdown.items],
  )

  const onChangeAdvertiser = useCallback(
    (option: SelectOption) => {
      const { value } = option
      replace({
        pathname: '/dashboard',
        query:
          value && +value
            ? {
                advertiserId: +value,
                range,
              }
            : { range },
      })
    },
    [range, replace],
  )

  const onChangeNonAdvertiserFilter = useCallback(
    (
      option: Omit<SelectOption, 'label'>,
      fieldName: 'journeyId' | 'stageId' | 'range',
    ) => {
      const { value } = option
      let queryParams: FilterQueryParams = {}

      if (value) {
        queryParams = {
          ...query,
          [fieldName]: value,
        }
      } else {
        queryParams = omit(query, fieldName)
      }

      replace({
        pathname: '/dashboard',
        query: queryParams,
      })
    },
    [replace, query],
  )

  const onChangeJourney = useCallback(
    (option: SelectOption) => {
      onChangeNonAdvertiserFilter(option, 'journeyId')
    },
    [onChangeNonAdvertiserFilter],
  )

  const onChangeStage = useCallback(
    (option: SelectOption) => {
      onChangeNonAdvertiserFilter(option, 'stageId')
    },
    [onChangeNonAdvertiserFilter],
  )

  const onChangeDateRange = useCallback(
    date => {
      const value = getUrlDateRangeString(date)
      onChangeNonAdvertiserFilter({ value }, 'range')
      setDateRange(date)
    },
    [onChangeNonAdvertiserFilter],
  )

  const gotoGeneralSettings = useCallback(() => {
    push('/journey/create/general-settings')
  }, [push])

  const advertiser = useMemo(
    () =>
      getInitialValueFromList(
        advertiserDropdown.items,
        advertiserId as string,
        ALL_ADVERTISERS_VALUE,
      ),
    [advertiserDropdown, advertiserId],
  )

  const journey = useMemo(
    () =>
      getInitialValueFromList(
        journeysList.items,
        journeyId as string,
        ALL_JOURNEYS_VALUE,
      ),
    [journeyId, journeysList.items],
  )

  const stage = useMemo(
    () =>
      getInitialValueFromList(
        publishedJourneyStagesDropdown.items,
        stageId as string,
        ALL_STAGES_VALUE,
      ),
    [publishedJourneyStagesDropdown.items, stageId],
  )

  const initialValues = useMemo(() => ({ advertiser, journey, stage }), [
    advertiser,
    journey,
    stage,
  ])

  return (
    <Form
      onSubmit={() => {}}
      initialValues={initialValues}
      render={() => (
        <>
          <FilterItem gridArea={ADVERTISER_AREA}>
            <SearchingSelect
              name="advertiser"
              options={advertiserOptions}
              onChange={onChangeAdvertiser}
            />
          </FilterItem>
          <FilterItem gridArea={JOURNEY_AREA}>
            <SearchingSelect
              name="journey"
              options={journeysOptions}
              onChange={onChangeJourney}
            />
          </FilterItem>
          <FilterItem gridArea={STAGE_AREA}>
            <SearchingSelect
              name="stage"
              options={publishedJourneyStagesOptions}
              onChange={onChangeStage}
            />
          </FilterItem>
          <DateRangeFilterWrapper>
            <DateRangeLabel>Date Range</DateRangeLabel>
            <DateRangePresetsPicker
              dateRange={dateRange}
              onApply={onChangeDateRange}
              presets={dashboardDateRangePresets}
              Trigger={DateRangeTrigger}
            />
          </DateRangeFilterWrapper>
          <FilterItem gridArea={NEW_JOURNEY_BUTTON_AREA}>
            {journeyPermission.create && (
              <Button
                fullWidth
                isCentered
                icon="60-add"
                onClick={gotoGeneralSettings}
                size="l">
                {strings.journeysAdvertisersTable.newJourney}
              </Button>
            )}
          </FilterItem>
        </>
      )}
    />
  )
}

export default React.memo(DashboardFilters)
