import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { stripTime } from '../../../lib/date-utils';
import dayjs from '../../../lib/dayjs';

import { DateRange } from '../../DateRange';
import { Box, Flex } from '../../Grid';
import PeriodFilterPresetsSelect from '../../PeriodFilterPresetsSelect';
import PopupMenu from '../../PopupMenu';
import StyledButton from '../../StyledButton';
import StyledButtonSet from '../../StyledButtonSet';
import StyledInput from '../../StyledInput';
import StyledInputField from '../../StyledInputField';
import StyledTooltip from '../../StyledTooltip';
import { Span } from '../../Text';

const DEFAULT_INTERVAL = { from: '', to: '' };

/**
 * Parse `strValue` in a "dateFrom→dateTo" format and returns an array like [dateFrom, dateTo].
 * Each value in the array will be `undefined` if there's no filter for it. We consider that all values passed
 * in this string are using UTC timezone.
 */
export const getDateRangeFromPeriod = strValue => {
  const parsedValue = strValue?.match(/([^→]+)(→(.+?(?=~UTC)))?(~UTC)?/);
  if (parsedValue) {
    const getDateIsoString = dateStr => (!dateStr || dateStr === 'all' ? undefined : dateStr);
    return [getDateIsoString(parsedValue[1]), getDateIsoString(parsedValue[3])];
  }

  return [];
};

/**
 * Opposite of `getDateRangeFromPeriod`: takes an object like {from, to} and returns a string
 * like "from→to".
 */
const encodePeriod = interval => {
  if (!interval.from && !interval.to) {
    return '';
  }

  const isUTC = interval.timezoneType === 'UTC';
  const encodeDate = (date, isEndOfDay) => {
    if (!date) {
      return 'all';
    } else {
      const dayjsTimeMethod = isEndOfDay ? 'endOf' : 'startOf';
      const result = isUTC ? dayjs.utc(date) : dayjs(date);
      return result[dayjsTimeMethod]('day').toISOString();
    }
  };

  const baseResult = `${encodeDate(interval.from, false)}→${encodeDate(interval.to, true)}`;
  return isUTC ? `${baseResult}~UTC` : baseResult;
};

/**
 * Get a date range as stored internally from a `value` prop, that can be either an array
 * like [from, to] or a stringified value (see `encodePeriod`).
 */
const getDateRangeFromValue = value => {
  const intervalFromValue = Array.isArray(value) ? value : getDateRangeFromPeriod(value);
  const strInterval = typeof value === 'string' ? value : '';
  return {
    from: stripTime(intervalFromValue[0] || DEFAULT_INTERVAL.from),
    to: stripTime(intervalFromValue[1] || DEFAULT_INTERVAL.to),
    timezoneType: strInterval.endsWith('~UTC') ? 'UTC' : 'local',
  };
};

/**
 * Update `interval` with a new value for `from` or `to` and return the updated interval
 * as a new object.
 */
const getNewInterval = (interval, changeField, newValue) => {
  const newInterval = { ...interval };
  newInterval[changeField] = stripTime(newValue);

  // Reset interval in case fromDate is after toDate
  if (newInterval.from && newInterval.to && newInterval.from > newInterval.to) {
    const fieldToReset = changeField === 'from' ? 'to' : 'from';
    newInterval[fieldToReset] = '';
  }

  return newInterval;
};

const getTimeZoneTypeName = (intl, timezone) => {
  if (timezone === 'local') {
    try {
      return intl.timeZone || dayjs.tz.guess();
    } catch {
      return '';
    }
  } else if (timezone === 'UTC') {
    return 'Coordinated Universal Time';
  } else {
    return '';
  }
};

const TriggerContainer = styled(StyledButton)`
  min-height: 38px;
  outline: 0;
  background: #f7f8fa;
  padding: 0 16px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: hsl(0, 0%, 20%);

  svg {
    transition: color 0.2s;
  }

  &:hover {
    border-color: #c4c7cc;
    svg {
      color: #999999;
    }
  }

  &:active,
  &:focus {
    background: white;
    color: hsl(0, 0%, 20%);
    box-shadow: 0 0 0 2px black;
  }
`;

const PeriodFilter = ({ onChange, value, inputId, minDate, ...props }) => {
  const intl = useIntl();
  const [dateInterval, setDateInterval] = React.useState(getDateRangeFromValue(value));
  const formattedMin = stripTime(minDate);

  const setDate = (changeField, date) => {
    setDateInterval(getNewInterval(dateInterval, changeField, date));
  };

  return (
    <PopupMenu
      placement="bottom-start"
      onClose={() => setDateInterval(getDateRangeFromValue(value))}
      Button={({ onClick }) => (
        <TriggerContainer onClick={onClick} id={inputId} data-cy="period-filter" {...props}>
          <Flex justifyContent="space-between" alignItems="center">
            <DateRange from={dateInterval.from} to={dateInterval.to} isUTC={dateInterval.timezoneType === 'UTC'} />
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </TriggerContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="8px" width="190px">
          <Box mb={3}>
            <PeriodFilterPresetsSelect
              inputId={`${inputId}-presets-select`}
              onChange={setDateInterval}
              interval={dateInterval}
            />
          </Box>
          <StyledInputField
            label={<FormattedMessage defaultMessage="Start date" />}
            labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
            name="dateFrom"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(dateInterval.from)}
                min={formattedMin}
                onChange={e => setDate('from', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            label={<FormattedMessage defaultMessage="End date" />}
            labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
            name="dateTo"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                width="100%"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={stripTime(dateInterval.to)}
                min={formattedMin}
                max={stripTime(new Date())}
                onChange={e => setDate('to', e.target.value)}
              />
            )}
          </StyledInputField>
          <StyledInputField
            data-cy="download-csv-end-date"
            name="timezoneType"
            mt="12px"
            labelFontSize="13px"
            label={
              <Flex alignItems="center">
                <StyledTooltip
                  content={
                    <FormattedMessage defaultMessage="By default, all dates are filtered and displayed using your local timezone. You can switch to UTC to indicate that the dates provided above use the Coordinated Universal Time format, which matches how email reports are generated" />
                  }
                >
                  <InfoCircle size={16} />
                </StyledTooltip>
                <Span ml={1}>
                  <FormattedMessage defaultMessage="Timezone" />
                </Span>
              </Flex>
            }
          >
            {inputProps => (
              <StyledButtonSet
                {...inputProps}
                size="tiny"
                items={['local', 'UTC']}
                buttonProps={{ p: 1, fontSize: '11px' }}
                selected={dateInterval.timezoneType}
                buttonPropsBuilder={({ item }) => ({ title: getTimeZoneTypeName(intl, item) })}
                onChange={timezoneType => {
                  setDateInterval({ ...dateInterval, timezoneType });
                }}
              >
                {({ item }) => {
                  switch (item) {
                    case 'local':
                      return <FormattedMessage defaultMessage="Local" />;
                    case 'UTC':
                      return <FormattedMessage defaultMessage="UTC" />;
                  }
                }}
              </StyledButtonSet>
            )}
          </StyledInputField>
          <Flex mt={2}>
            <StyledButton
              buttonSize="tiny"
              mr={2}
              mt="12px"
              flex="1"
              onClick={() => {
                setDateInterval(DEFAULT_INTERVAL);
                setOpen(false);
                onChange('');
              }}
            >
              <FormattedMessage id="Reset" defaultMessage="Reset" />
            </StyledButton>
            <StyledButton
              buttonSize="tiny"
              buttonStyle="primary"
              mt="12px"
              data-cy="btn-apply-period-filter"
              flex="1"
              onClick={() => {
                onChange(encodePeriod(dateInterval));
                setOpen(false);
              }}
            >
              <FormattedMessage id="Apply" defaultMessage="Apply" />
            </StyledButton>
          </Flex>
        </Box>
      )}
    </PopupMenu>
  );
};

PeriodFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  /** The value, either as a string with the `dateFrom→dateTo` format or an array like [dateFromIsoStr, dateToIsoStr] */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  inputId: PropTypes.string,
  minDate: PropTypes.string,
};

export default PeriodFilter;
